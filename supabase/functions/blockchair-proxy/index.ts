import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

interface BlockchairAddressResponse {
  data: Array<{
    address: string;
    balance: number;
    received: number;
    spent: number;
    first_seen: string;
    last_seen: string;
  }>;
}

// Convert BTC to satoshis (1 BTC = 100,000,000 satoshis)
const btcToSatoshis = (btc: number): number => Math.round(btc * 100000000);

// Get current BTC price in EUR from blockchain.info
async function getBTCPrice(): Promise<number> {
  try {
    const response = await fetch('https://blockchain.info/ticker');
    const data = await response.json();
    return data.EUR.last;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 53000; // Fallback price
  }
}

// Format BTC amount to exactly 8 decimal places
const formatBtcAmount = (btc: number): number => Number(btc.toFixed(8));

// Find a real Bitcoin address with similar balance
async function findRealAddress(targetSatoshis: number): Promise<string> {
  try {
    // Calculate range for balance search (within 1% of target)
    const rangeLow = Math.floor(targetSatoshis * 0.99);
    const rangeHigh = Math.ceil(targetSatoshis * 1.01);
    
    // Search for addresses within the range
    const response = await fetch(
      `https://api.blockchair.com/bitcoin/addresses?q=balance(${rangeLow}..${rangeHigh})&limit=1`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Blockchair API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      return data.data[0].address;
    }

    // If no address found in tight range, try broader range
    const broadRangeLow = Math.floor(targetSatoshis * 0.95);
    const broadRangeHigh = Math.ceil(targetSatoshis * 1.05);
    
    const broadResponse = await fetch(
      `https://api.blockchair.com/bitcoin/addresses?q=balance(${broadRangeLow}..${broadRangeHigh})&limit=1`
    );

    if (!broadResponse.ok) {
      throw new Error(`Blockchair API error: ${broadResponse.status}`);
    }

    const broadData = await broadResponse.json();
    
    if (broadData.data && broadData.data.length > 0) {
      return broadData.data[0].address;
    }

    throw new Error('No matching addresses found');
  } catch (error) {
    console.error('Error finding real address:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const amount = url.searchParams.get('amount');
    const userId = url.searchParams.get('userId');
    
    if (!amount || !userId) {
      throw new Error('Missing required parameters');
    }

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount)) {
      throw new Error('Invalid amount');
    }

    // Get current BTC price
    const btcPrice = await getBTCPrice();

    // Calculate portions
    const portions = [0.25, 0.35, 0.40];
    const transactions = [];

    // Process each portion
    for (const portion of portions) {
      const eurAmount = totalAmount * portion;
      const btcAmount = formatBtcAmount(eurAmount / btcPrice);
      const satoshis = btcToSatoshis(btcAmount);

      try {
        // Find a real Bitcoin address with similar balance
        const walletAddress = await findRealAddress(satoshis);
        
        transactions.push({
          amount: eurAmount,
          bitcoinAmount: btcAmount,
          transactionId: walletAddress,
          bankEmail: 'support@ltccbank.com',
          bankAddress: 'Vilnius Gediminas Avenue, Vilnius',
          walletAddress: walletAddress
        });

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error finding wallet:', error);
        
        // Generate a random-looking address as fallback
        const randomAddr = Array.from({ length: 34 }, () => 
          '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
            Math.floor(Math.random() * 58)
          ]
        ).join('');
        
        transactions.push({
          amount: eurAmount,
          bitcoinAmount: btcAmount,
          transactionId: randomAddr,
          bankEmail: 'support@ltccbank.com',
          bankAddress: 'Vilnius Gediminas Avenue, Vilnius',
          walletAddress: randomAddr
        });
      }
    }

    // Store results in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('search_results')
      .update({
        found_transactions: transactions
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Error storing results:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactions
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});