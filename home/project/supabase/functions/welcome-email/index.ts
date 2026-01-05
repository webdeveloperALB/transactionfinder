import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const sendWelcomeEmail = async (supabase: any, email: string, name: string, secretCode: string) => {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Transaction Finder!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for registering with Transaction Finder. We're here to help you track and recover your transactions securely.</p>
      <p>Your secret recovery code is: <strong>${secretCode}</strong></p>
      <p>Please keep this code safe as you'll need it to:</p>
      <ul>
        <li>Track the status of your transaction search</li>
        <li>Access your search results</li>
        <li>Verify your identity for support requests</li>
      </ul>
      <p>If you need any assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The Transaction Finder Team</p>
    </div>
  `;

  const { error } = await supabase.auth.admin.sendRawEmail({
    to: email,
    subject: 'Welcome to Transaction Finder - Your Recovery Code',
    html: emailContent,
  });

  if (error) {
    throw new Error('Failed to send email');
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, name, secretCode } = await req.json();

    if (!email || !name || !secretCode) {
      throw new Error('Missing required fields');
    }

    await sendWelcomeEmail(supabase, email, name, secretCode);

    return new Response(
      JSON.stringify({ message: 'Welcome email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});