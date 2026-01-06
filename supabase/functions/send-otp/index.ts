import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { SMTPClient } from "npm:emailjs@4.0.3";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://transactionfinder.vercel.app',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('Received request to send OTP');
    
    // Add CORS headers to all responses
    const addCorsHeaders = (response: Response) => {
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    };

    // Parse request body
    let email, name;
    try {
      const body = await req.json();
      email = body.email;
      name = body.name;
    } catch (parseError) {
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }
    
    if (!email || !name) {
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: email and name are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }

    console.log('Sending OTP to:', email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid email format'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      return addCorsHeaders(new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to store OTP'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      ));
    }

    // ... rest of your email sending code remains the same ...

    return addCorsHeaders(new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    ));

  } catch (error) {
    console.error('OTP email error:', error);
    
    // Create error response with CORS headers
    const errorResponse = new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    return addCorsHeaders(errorResponse);
  }
});