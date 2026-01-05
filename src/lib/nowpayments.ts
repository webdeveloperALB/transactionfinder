import { createClient } from '@supabase/supabase-js';

interface CreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  payment_extra_id: string;
}

interface PaymentStatusResponse {
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
  outcome_amount: number;
  outcome_currency: string;
}

// Minimum amount in EUR that NowPayments accepts
const MIN_PAYMENT_AMOUNT = 1;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const JITTER_MAX = 1000; // Maximum jitter in milliseconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    console.log(`Retrying operation. Attempts remaining: ${retries}`);
    // Add jitter to the delay to prevent thundering herd
    const jitter = Math.random() * JITTER_MAX;
    await sleep(delay + jitter);
    
    return retryWithExponentialBackoff(
      operation,
      retries - 1,
      delay * 2
    );
  }
}

export const nowpayments = {
  createPayment: async (amount: number, tier: string, secretCode: string, cryptocurrency: string): Promise<CreatePaymentResponse> => {
    try {
      // Validate minimum amount
      if (amount < MIN_PAYMENT_AMOUNT) {
        throw new Error(`Minimum payment amount is ${MIN_PAYMENT_AMOUNT} EUR`);
      }

      // Handle USDT network selection
      let paymentCurrency = cryptocurrency.toUpperCase();
      if (paymentCurrency === 'USDT') {
        // Default to USDT on Tron network (TRC20)
        paymentCurrency = 'USDTTRC20';
      }

      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount,
            tier,
            secretCode,
            cryptocurrency: paymentCurrency
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Invalid response from payment service' }));
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Enhanced error messages
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to payment service. Please try again or choose a different payment method. If the issue persists, contact support.');
      }
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  getPaymentStatus: async (paymentId: string): Promise<PaymentStatusResponse> => {
    try {
      return await retryWithExponentialBackoff(async () => {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-status?paymentId=${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Log response details for debugging
        console.debug('Payment status response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Payment status error response (${response.status}):`, errorText);
          
          let errorMessage = `Failed to get payment status (HTTP ${response.status})`;
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage = errorText;
            }
          }
          
          throw new Error(errorMessage);
        }

        const text = await response.text();
        
        // Handle empty response
        if (!text || text.trim() === '') {
          console.error('Empty response received from payment service');
          throw new Error('Payment service returned an empty response');
        }

        try {
          // Validate JSON before parsing
          const data = JSON.parse(text);
          
          // Basic validation of required fields
          if (!data.payment_id || !data.payment_status) {
            console.error('Invalid payment status response format:', data);
            throw new Error('Invalid payment status data received');
          }
          
          return data;
        } catch (e) {
          console.error('Failed to parse payment status response:', text);
          throw new Error('Invalid response format from payment service');
        }
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  },

  confirmPayment: async (paymentId: string): Promise<PaymentStatusResponse> => {
    try {
      return await retryWithExponentialBackoff(async () => {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-status?paymentId=${paymentId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const text = await response.text();
          let errorMessage = 'Failed to confirm payment';
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const text = await response.text();
        if (!text) {
          throw new Error('Empty response from payment service');
        }

        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse payment confirmation response:', text);
          throw new Error('Invalid response format from payment service');
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error confirming payment:', error.message);
        throw new Error(`Payment confirmation failed: ${error.message}`);
      }
      console.error('Error confirming payment:', error);
      throw new Error('Payment confirmation failed');
    }
  }
};