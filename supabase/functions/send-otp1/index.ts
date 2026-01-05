import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { SMTPClient } from "npm:emailjs@4.0.3";

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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    console.log('Received request to send OTP');
    const { email, name } = await req.json();
    
    if (!email || !name) {
      throw new Error('Missing required fields');
    }

    console.log('Sending OTP to:', email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Storing OTP in database');

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('email_otps')
      .insert({
        email,
        code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error('Database error:', dbError);
      await logEmailAttempt(supabase, email, 'OTP', 'failed', 'Database error: ' + dbError.message);
      throw new Error('Failed to store OTP');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
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
                      Verify Your Email
                    </h1>
                    
                    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      Hi ${name},<br><br>
                      Please use this verification code to complete your registration:
                    </p>

                    <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; margin: 0 0 30px 0; text-align: center;">
                      <span style="color: #00F5A0; font-family: monospace; font-size: 32px; letter-spacing: 4px;">
                        ${otp}
                      </span>
                    </div>

                    <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
                      This code will expire in 10 minutes.<br>
                      If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
                      © 2025 Transaction Finder. All rights reserved.
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
      Your Transaction Finder Verification Code

      Hi ${name},

      Please use this verification code to complete your registration:

      ${otp}

      This code will expire in 10 minutes.
      If you didn't request this code, please ignore this email.

      © 2025 Transaction Finder. All rights reserved.
    `;

    const message = {
      from: "Transaction Finder <support@transactionfinder.in>",
      to: email,
      subject: "Your Transaction Finder Verification Code",
      attachment: [
        { data: textContent, alternative: true },
        { data: htmlContent, alternative: true }
      ]
    };

    console.log('Sending email via SMTP');

    try {
      await client.send(message);
      console.log('Email sent successfully');
      await logEmailAttempt(supabase, email, 'OTP', 'success', null, { expires_at: expiresAt });
    } catch (emailError) {
      console.error('SMTP Error:', emailError);
      await logEmailAttempt(supabase, email, 'OTP', 'failed', `SMTP Error: ${emailError.message}`);
      throw emailError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully'
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('OTP email error:', error);
    
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