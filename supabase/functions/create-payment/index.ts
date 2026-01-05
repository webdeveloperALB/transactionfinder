import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// NOWPayments API configuration
const API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY');
const API_BASE = 'https://api.nowpayments.io/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CreatePaymentRequest {
  amount: number;
  tier: string;
  secretCode: string;
  cryptocurrency: string;
}

// Minimum amount in EUR that NOWPayments accepts
const MIN_PAYMENT_AMOUNT = 1;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('NOWPayments API key not configured');
    }

    const { amount, tier, secretCode, cryptocurrency }: CreatePaymentRequest = await req.json();

    if (!amount || !tier || !secretCode || !cryptocurrency) {
      throw new Error('Missing required fields');
    }

    // Validate minimum amount
    if (amount < MIN_PAYMENT_AMOUNT) {
      throw new Error(`Minimum payment amount is ${MIN_PAYMENT_AMOUNT} EUR`);
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('secret_code', secretCode)
      .maybeSingle();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    // Check if this is an upgrade
    const { data: currentSearch } = await supabase
      .from('search_results')
      .select('tier')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isUpgrade = currentSearch?.tier === 'free' && tier !== 'free';

    // Create payment with NOWPayments production API
    const paymentResponse = await fetch(`${API_BASE}/payment`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'EUR',
        pay_currency: cryptocurrency,
        order_id: `TF_${userData.id}_${Date.now()}`,
        order_description: `Transaction Finder ${tier} Tier${isUpgrade ? ' Upgrade' : ''}`,
        ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
        case: 'common'
      })
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      console.error('NOWPayments error:', errorData);
      throw new Error(errorData.message || 'Failed to create payment');
    }

    const payment = await paymentResponse.json();

    // Store payment in database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userData.id,
        payment_id: payment.payment_id,
        amount: amount,
        currency: 'EUR',
        status: payment.payment_status,
        tier: tier,
        payment_method: cryptocurrency,
        is_upgrade: isUpgrade
      });

    if (paymentError) {
      throw new Error('Failed to store payment information');
    }

    return new Response(JSON.stringify(payment), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    return new Response(
      JSON.stringify({
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