import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface WebhookPayload {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract user ID from order_id (format: TF_userId_timestamp)
    const userId = payload.order_id.split('_')[1];
    if (!userId) {
      throw new Error('Invalid order ID format');
    }

    // Update payment status in database
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: payload.payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', payload.payment_id);

    if (paymentError) {
      console.error('Payment update error:', paymentError);
      throw paymentError;
    }

    // If payment is completed, update search results
    if (payload.payment_status === 'finished' || payload.payment_status === 'confirmed') {
      // Get payment details
      const { data: paymentData, error: paymentDetailsError } = await supabase
        .from('payments')
        .select('tier, is_upgrade')
        .eq('payment_id', payload.payment_id)
        .single();

      if (paymentDetailsError) throw paymentDetailsError;

      // Calculate search duration based on tier
      const duration = paymentData?.tier === 'pro' ? 72 : 168; // hours
      const now = new Date();
      const endTime = new Date(now.getTime() + (duration * 60 * 60 * 1000));

      // First update search results with new status and times
      const { error: searchError } = await supabase
        .from('search_results')
        .update({
          status: 'searching',
          search_started_at: now.toISOString(),
          search_completed_at: endTime.toISOString(),
          tier: paymentData?.tier,
          payment_status: 'completed',
          payment_completed_at: now.toISOString(),
          search_progress: 0,
          payment_required: false
        })
        .eq('user_id', userId)
        .is('payment_completed_at', null)
        .single();

      if (searchError) {
        console.error('Search results update error:', searchError);
        throw searchError;
      }

      // Then trigger the Blockchair proxy to find transactions
      const blockchairResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/blockchair-proxy?` + 
        new URLSearchParams({
          amount: payload.price_amount.toString(),
          userId: userId
        }),
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!blockchairResponse.ok) {
        console.error('Blockchair proxy error:', await blockchairResponse.text());
        throw new Error('Failed to fetch wallet addresses');
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});