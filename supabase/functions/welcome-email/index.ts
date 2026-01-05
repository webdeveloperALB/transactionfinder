import { SMTPClient } from "npm:emailjs@4.0.3";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'Content-Length',
  'Content-Type': 'application/json'
};

// SMTP Configuration
const smtpConfig = {
  host: Deno.env.get('SMTP_HOST') || "smtp.hostinger.com",
  port: parseInt(Deno.env.get('SMTP_PORT') || "465"),
  user: Deno.env.get('SMTP_USERNAME') || "support@transactionfinder.in",
  password: Deno.env.get('SMTP_PASSWORD') || "fLR[j|3;3",
  ssl: true,
};

console.log('SMTP Config:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  user: smtpConfig.user,
  ssl: smtpConfig.ssl
});

const client = new SMTPClient({
  host: smtpConfig.host,
  port: smtpConfig.port,
  user: smtpConfig.user,
  password: smtpConfig.password,
  ssl: smtpConfig.ssl,
  timeout: 10000,
});

async function logEmailAttempt(supabase: any, email: string, type: string, status: string, error?: string, metadata: any = {}) {
  try {
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        email,
        type,
        status,
        error,
        metadata
      });

    if (logError) {
      console.error('Failed to log email attempt:', logError);
    }
  } catch (error) {
    console.error('Failed to log email attempt:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('Received request to send welcome email');
    const { email, name, secretCode } = await req.json();
    
    if (!email || !name || !secretCode) {
      throw new Error('Missing required fields');
    }

    console.log('Sending welcome email to:', email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Transaction Finder</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <!-- Logo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" 
                         alt="Transaction Finder Logo" 
                         style="width: 64px; height: 64px; margin-bottom: 20px; filter: invert(1);">
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" 
                     style="background: #1a1a1a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
                      Welcome to Transaction Finder!
                    </h1>
                    
                    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      Dear ${name},<br><br>
                      Thank you for registering with Transaction Finder. We're here to help you track and recover your transactions securely.
                    </p>

                    <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 30px; margin: 0 0 30px 0; text-align: center;">
                      <p style="color: rgba(255,255,255,0.8); font-size: 16px; margin: 0 0 15px 0;">
                        Your secret recovery code is:
                      </p>
                      <span style="color: #00F5A0; font-family: monospace; font-size: 32px; letter-spacing: 4px;">
                        ${secretCode}
                      </span>
                    </div>

                    <div style="margin: 0 0 30px 0;">
                      <p style="color: rgba(255,255,255,0.8); font-size: 16px; margin: 0 0 15px 0;">
                        Please keep this code safe as you'll need it to:
                      </p>
                      <ul style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 24px; margin: 0; padding: 0 0 0 20px;">
                        <li style="margin-bottom: 10px;">Track the status of your transaction search</li>
                        <li style="margin-bottom: 10px;">Access your search results</li>
                        <li style="margin-bottom: 10px;">Verify your identity for support requests</li>
                      </ul>
                    </div>

                    <div style="background: rgba(99,102,241,0.1); border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 24px; margin: 0;">
                        If you need any assistance, please don't hesitate to contact our support team at<br>
                        <a href="mailto:support@transactionfinder.in" 
                           style="color: #00F5A0; text-decoration: none;">
                          support@transactionfinder.in
                        </a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0 0 10px 0;">
                      © 2025 Transaction Finder. All rights reserved.
                    </p>
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
                      This email was sent to ${email}.<br>
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to Transaction Finder!

      Dear ${name},

      Thank you for registering with Transaction Finder. We're here to help you track and recover your transactions securely.

      Your secret recovery code is: ${secretCode}

      Please keep this code safe as you'll need it to:
      - Track the status of your transaction search
      - Access your search results
      - Verify your identity for support requests

      If you need any assistance, please don't hesitate to contact our support team at support@transactionfinder.in

      © 2025 Transaction Finder. All rights reserved.
      This email was sent to ${email}.
      Please do not reply to this email.
    `;

    const message = {
      from: "Transaction Finder <support@transactionfinder.in>",
      to: email,
      subject: "Welcome to Transaction Finder - Your Recovery Code",
      attachment: [
        { data: textContent, alternative: true },
        { data: htmlContent, alternative: true }
      ]
    };

    console.log('Sending email via SMTP');

    try {
      await client.send(message);
      console.log('Email sent successfully');
      await logEmailAttempt(supabase, email, 'WELCOME', 'success', null, { secret_code: secretCode });
    } catch (emailError) {
      console.error('SMTP Error:', emailError);
      await logEmailAttempt(supabase, email, 'WELCOME', 'failed', `SMTP Error: ${emailError.message}`);
      throw emailError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Welcome email sent successfully'
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Welcome email error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }
});