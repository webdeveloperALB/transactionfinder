import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { SMTPClient } from "npm:emailjs@4.0.3";

/**
 * CORS
 * - Use corsBase for OPTIONS
 * - Use jsonHeaders for JSON responses
 */
const corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const jsonHeaders = {
  ...corsBase,
  "Content-Type": "application/json",
};

/**
 * Env helpers
 */
function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/**
 * OTP generator
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Safe JSON parsing
 */
async function safeJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

/**
 * Logging helper (won't break main flow)
 */
async function logEmailAttempt(
  supabase: any,
  email: string,
  type: string,
  status: string,
  error?: string,
  metadata: any = {},
) {
  try {
    const { error: logError } = await supabase.from("email_logs").insert({
      email,
      type,
      status,
      error,
      metadata,
    });
    if (logError) console.error("Failed to log email attempt:", logError);
  } catch (e) {
    console.error("Failed to log email attempt (exception):", e);
  }
}

Deno.serve(async (req) => {
  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsBase });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method Not Allowed" }),
      { status: 405, headers: jsonHeaders },
    );
  }

  try {
    console.log("Received request to send OTP");

    // Parse body safely
    const body = await safeJson(req);
    const email = String(body?.email ?? "").trim();
    const name = String(body?.name ?? "").trim();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // ✅ Required env vars (fail fast, no insecure fallbacks)
    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SERVICE_ROLE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const SMTP_HOST = requireEnv("SMTP_HOST");
    const SMTP_PORT = parseInt(requireEnv("SMTP_PORT"), 10);
    const SMTP_USERNAME = requireEnv("SMTP_USERNAME");
    const SMTP_PASSWORD = requireEnv("SMTP_PASSWORD");

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Create SMTP client
    const client = new SMTPClient({
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USERNAME,
      password: SMTP_PASSWORD,
      ssl: true, // 465 usually uses implicit SSL
      timeout: 10000,
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log("Storing OTP in database for:", email);

    // Store OTP
    const { error: dbError } = await supabase.from("email_otps").insert({
      email,
      code: otp,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      await logEmailAttempt(
        supabase,
        email,
        "OTP",
        "failed",
        "Database error: " + dbError.message,
      );
      return new Response(
        JSON.stringify({ success: false, error: "Failed to store OTP" }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg"
                   alt="Transaction Finder Logo"
                   style="width:64px;height:64px;margin-bottom:20px;filter:invert(1);">
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
               style="background:#1a1a1a;border-radius:16px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#ffffff;font-size:24px;margin:0 0 20px 0;text-align:center;">
                Verify Your Email
              </h1>

              <p style="color:rgba(255,255,255,0.8);font-size:16px;line-height:24px;margin:0 0 30px 0;">
                Hi ${name},<br><br>
                Please use this verification code to complete your registration:
              </p>

              <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;margin:0 0 30px 0;text-align:center;">
                <span style="color:#00F5A0;font-family:monospace;font-size:32px;letter-spacing:4px;">
                  ${otp}
                </span>
              </div>

              <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:20px;margin:0;text-align:center;">
                This code will expire in 10 minutes.<br>
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center">
              <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
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
    `.trim();

    const textContent = `
Your Transaction Finder Verification Code

Hi ${name},

Please use this verification code to complete your registration:

${otp}

This code will expire in 10 minutes.
If you didn't request this code, please ignore this email.

© 2025 Transaction Finder. All rights reserved.
    `.trim();

    const message = {
      from: "Transaction Finder <support@transactionfinder.in>",
      to: email,
      subject: "Your Transaction Finder Verification Code",
      attachment: [
        { data: textContent, alternative: true },
        { data: htmlContent, alternative: true },
      ],
    };

    console.log("Sending email via SMTP:", email);

    try {
      await client.send(message);
      console.log("Email sent successfully");
      await logEmailAttempt(supabase, email, "OTP", "success", undefined, {
        expires_at: expiresAt.toISOString(),
      });
    } catch (emailError: any) {
      console.error("SMTP Error:", emailError);
      await logEmailAttempt(
        supabase,
        email,
        "OTP",
        "failed",
        `SMTP Error: ${emailError?.message ?? String(emailError)}`,
      );

      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 502, headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error: any) {
    console.error("OTP email error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message ?? "An unknown error occurred",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
