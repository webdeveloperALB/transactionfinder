import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Use production API endpoint
const API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY');
const API_BASE = 'https://api.nowpayments.io/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');

    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const response = await fetch(`${API_BASE}/payment/${paymentId}`, {
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get payment status');
    }

    const status = await response.json();

    // Update payment status in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: status.payment_status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId);

    if (updateError) {
      console.error('Failed to update payment status:', updateError);
    }

    return new Response(JSON.stringify(status), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Payment status error:', error);
    
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