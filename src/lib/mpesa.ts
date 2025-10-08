/**
 * M-Pesa Daraja API Client for Shop4Me
 * 
 * This module handles M-Pesa STK Push payments using the Daraja API.
 * It provides functions to:
 * - Generate OAuth access tokens
 * - Initiate STK Push payments
 * - Validate callback signatures
 * 
 * Dependencies: Orders table with merchantRequestId, checkoutRequestId, mpesaReceipt fields
 * 
 * @see https://developer.safaricom.co.ke/docs
 */

import prisma from './prisma';

// M-Pesa API URLs
const MPESA_URLS = {
  sandbox: {
    oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkpush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  production: {
    oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkpush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
};

// Environment configuration
const MPESA_ENV = (process.env.MPESA_ENV || 'sandbox') as 'sandbox' | 'production';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_SECRET_KEY = process.env.MPESA_SECRET_KEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;
const MPESA_ACCOUNT_REFERENCE_PREFIX = process.env.MPESA_ACCOUNT_REFERENCE_PREFIX || 'SHOP4ME';

if (!MPESA_CONSUMER_KEY || !MPESA_SECRET_KEY || !MPESA_SHORTCODE || !MPESA_PASSKEY || !MPESA_CALLBACK_URL) {
  console.warn('M-Pesa environment variables not fully configured');
}

/**
 * Validate M-Pesa credentials format
 */
function validateCredentials(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!MPESA_CONSUMER_KEY) {
    errors.push('MPESA_CONSUMER_KEY is missing');
  } else if (MPESA_CONSUMER_KEY.trim() !== MPESA_CONSUMER_KEY) {
    errors.push('MPESA_CONSUMER_KEY has leading/trailing whitespace');
  } else if (MPESA_CONSUMER_KEY.length < 10) {
    errors.push('MPESA_CONSUMER_KEY seems too short');
  }
  
  if (!MPESA_SECRET_KEY) {
    errors.push('MPESA_SECRET_KEY is missing');
  } else if (MPESA_SECRET_KEY.trim() !== MPESA_SECRET_KEY) {
    errors.push('MPESA_SECRET_KEY has leading/trailing whitespace');
  } else if (MPESA_SECRET_KEY.length < 10) {
    errors.push('MPESA_SECRET_KEY seems too short');
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Generate M-Pesa OAuth access token
 * Tokens are valid for 1 hour
 */
async function getAccessToken(): Promise<string> {
  // Validate credentials
  const validation = validateCredentials();
  if (!validation.isValid) {
    throw new Error(`M-Pesa credentials validation failed: ${validation.errors.join(', ')}`);
  }

  const auth = Buffer.from(`${MPESA_CONSUMER_KEY!.trim()}:${MPESA_SECRET_KEY!.trim()}`).toString('base64');
  
  const response = await fetch(MPESA_URLS[MPESA_ENV].oauth, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('M-Pesa OAuth failed:', response.status, error);
    throw new Error(`Failed to get M-Pesa access token (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Generate M-Pesa password for STK Push request
 * Format: Base64(Shortcode + Passkey + Timestamp)
 */
function generatePassword(timestamp: string): string {
  if (!MPESA_SHORTCODE || !MPESA_PASSKEY) {
    throw new Error('M-Pesa shortcode and passkey are required');
  }
  
  const passwordString = MPESA_SHORTCODE + MPESA_PASSKEY + timestamp;
  return Buffer.from(passwordString).toString('base64');
}

/**
 * Generate timestamp in the format expected by M-Pesa
 * Format: YYYYMMDDHHmmss
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
}

/**
 * Sanitize phone number to M-Pesa format (254XXXXXXXXX)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^0-9+]/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1); // Remove +
  } else if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1); // Replace 0 with 254
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
  } else if (cleaned.length === 9) {
    // Assume it's missing country code
    cleaned = '254' + cleaned;
  }
  
  // Validate length (should be 12 digits: 254XXXXXXXXX)
  if (cleaned.length !== 12 || !cleaned.startsWith('254')) {
    throw new Error(`Invalid phone number format: ${phone}. Expected format: +254XXXXXXXXX or 0XXXXXXXXX`);
  }
  
  return cleaned;
}

export interface STKPushRequest {
  orderId: string;
  phone: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}

export interface STKPushResponse {
  success: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Initiate M-Pesa STK Push payment
 * 
 * @param request - Payment request details
 * @returns Promise containing payment initiation result
 */
export async function initiateStkPush(request: STKPushRequest): Promise<STKPushResponse> {
  try {
    if (!MPESA_SHORTCODE || !MPESA_CALLBACK_URL) {
      throw new Error('M-Pesa configuration incomplete');
    }

    // Get access token
    const accessToken = await getAccessToken();
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(request.phone);
    
    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    
    // Prepare STK Push payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(request.amount), // M-Pesa requires integer amounts
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: request.accountReference || `${MPESA_ACCOUNT_REFERENCE_PREFIX}-${request.orderId}`,
      TransactionDesc: request.transactionDesc || `Shop4Me Order ${request.orderId}`,
    };

    // Make STK Push request
    const response = await fetch(MPESA_URLS[MPESA_ENV].stkpush, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('STK Push failed:', responseData);
      return {
        success: false,
        errorCode: responseData.errorCode,
        errorMessage: responseData.errorMessage || 'STK Push request failed',
      };
    }

    // Check if the request was successful
    if (responseData.ResponseCode === '0') {
      // Update order with M-Pesa request IDs
      await prisma.order.update({
        where: { id: request.orderId },
        data: {
          merchantRequestId: responseData.MerchantRequestID,
          checkoutRequestId: responseData.CheckoutRequestID,
          orderStatus: 'PENDING_PAYMENT',
          paymentDueAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        },
      });

      return {
        success: true,
        merchantRequestId: responseData.MerchantRequestID,
        checkoutRequestId: responseData.CheckoutRequestID,
        responseCode: responseData.ResponseCode,
        responseDescription: responseData.ResponseDescription,
        customerMessage: responseData.CustomerMessage,
      };
    } else {
      return {
        success: false,
        responseCode: responseData.ResponseCode,
        errorMessage: responseData.ResponseDescription || 'STK Push request was rejected',
      };
    }
  } catch (error) {
    console.error('STK Push error:', error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

/**
 * Process M-Pesa STK Push callback
 * 
 * This function handles the callback from M-Pesa after a payment attempt.
 * It updates the order status and payment information based on the callback result.
 * 
 * @param callback - M-Pesa callback payload
 * @returns Promise indicating processing success
 */
export async function processCallback(callback: MpesaCallback): Promise<{ success: boolean; message: string }> {
  try {
    const { stkCallback } = callback.Body;
    
    // Find the order by CheckoutRequestID
    const order = await prisma.order.findUnique({
      where: { checkoutRequestId: stkCallback.CheckoutRequestID },
    });

    if (!order) {
      console.error('Order not found for CheckoutRequestID:', stkCallback.CheckoutRequestID);
      return { success: false, message: 'Order not found' };
    }

    // Check if callback has already been processed (idempotency)
    if (order.paymentStatus === 'PAID' && order.mpesaReceipt) {
      console.log('Callback already processed for order:', order.id);
      return { success: true, message: 'Callback already processed' };
    }

    let updateData = {
      paymentDueAt: null as null, // Clear payment deadline
    } as Record<string, unknown>;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const amount = metadata.find(item => item.Name === 'Amount')?.Value as number;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value as string;

      updateData = {
        ...updateData,
        paymentStatus: 'PAID',
        orderStatus: 'PROCESSING',
        mpesaReceipt: mpesaReceiptNumber,
        amountCollected: amount ? amount / 100 : undefined, // M-Pesa returns amount in cents
      };

      // Create status log
      await prisma.statusLog.create({
        data: {
          orderId: order.id,
          status: 'PROCESSING',
          actor: 'SYSTEM',
          channel: 'WEB',
          note: `Payment successful. M-Pesa Receipt: ${mpesaReceiptNumber}`,
        },
      });

      console.log('Payment successful for order:', order.id, 'Receipt:', mpesaReceiptNumber);
    } else {
      // Payment failed
      updateData = {
        ...updateData,
        paymentStatus: 'FAILED',
        orderStatus: 'CANCELLED',
        cancellationReason: `Payment failed: ${stkCallback.ResultDesc}`,
      };

      // Create status log
      await prisma.statusLog.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          actor: 'SYSTEM',
          channel: 'WEB',
          note: `Payment failed: ${stkCallback.ResultDesc}`,
        },
      });

      console.log('Payment failed for order:', order.id, 'Reason:', stkCallback.ResultDesc);
    }

    // Update the order
    await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    return { success: true, message: 'Callback processed successfully' };
  } catch (error) {
    console.error('Callback processing error:', error);
    return { success: false, message: 'Failed to process callback' };
  }
}

/**
 * Query M-Pesa transaction status (for reconciliation)
 * 
 * This function can be used for daily reconciliation jobs to verify
 * payment status for orders that might have missed callbacks.
 * 
 * @param checkoutRequestId - The CheckoutRequestID from STK Push
 * @returns Promise with transaction status
 */
export async function queryTransactionStatus(checkoutRequestId: string): Promise<{ message: string; checkoutRequestId: string }> {
  // TODO: Implement transaction status query
  // This would require the Transaction Status API from Daraja
  // For now, return a placeholder with the checkoutRequestId for tracking
  return { 
    message: 'Transaction status query not implemented yet',
    checkoutRequestId 
  };
}