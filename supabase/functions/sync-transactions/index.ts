import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

// Target Supabase project configuration
const TARGET_SUPABASE_URL = 'https://ypoqtjcxnujjnwskaawt.supabase.co';
const TARGET_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3F0amN4bnVqam53c2thYXd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY1NDc2NjEyMSwiZXhwIjoxOTcwMzQyMTIxfQ.m9BhfxiTmNhZTH2WTYAZAMj8fUqSW_SjK_xFnZuRVpM';

interface Transaction {
  email: string;
  amount: number;
  btcAmount: number;
  walletAddress: string;
  date: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, email } = await req.json();

    if (!transactions || !email) {
      throw new Error('Missing required fields');
    }

    console.log('Syncing transactions for email:', email);
    console.log('Transactions:', transactions);

    // Initialize target Supabase client
    const targetSupabase = createClient(
      TARGET_SUPABASE_URL,
      TARGET_SUPABASE_KEY
    );

    // Get existing transactions for this email within the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingTransactions, error: fetchError } = await targetSupabase
      .from('TransactionHistory')
      .select('thDetails, thPoi')
      .eq('thEmail', email)
      .gt('created_at', oneHourAgo);

    if (fetchError) {
      console.error('Error fetching existing transactions:', fetchError);
      throw fetchError;
    }

    // Insert each transaction into the target database if it doesn't exist
    const promises = transactions.map((tx: Transaction) => {
      // Check if this transaction already exists
      const transactionExists = existingTransactions?.some(
        existing => 
          existing.thDetails === `${tx.amount} EUR` && 
          existing.thPoi === tx.walletAddress
      );

      if (transactionExists) {
        console.log('Skipping duplicate transaction:', {
          amount: tx.amount,
          wallet: tx.walletAddress
        });
        return Promise.resolve();
      }

      console.log('Inserting new transaction:', {
        thEmail: email,
        thType: 'Deposit',
        thDetails: `${tx.amount} EUR`,
        thPoi: tx.walletAddress,
        thStatus: 'Successful'
      });

      return targetSupabase
        .from('TransactionHistory')
        .insert({
          thEmail: email,
          thType: 'Deposit',
          thDetails: `${tx.amount} EUR`,
          thPoi: tx.walletAddress,
          thStatus: 'Successful',
          created_at: tx.date || new Date().toISOString()
        })
        .then(result => {
          if (result.error) {
            console.error('Error inserting transaction:', result.error);
            throw result.error;
          }
          console.log('Successfully inserted transaction');
          return result;
        });
    });

    await Promise.all(promises);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
    
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