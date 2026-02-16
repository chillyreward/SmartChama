// M-Pesa Daraja API Integration
import axios from 'axios';

// Environment variables (add these to .env.local)
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORT_CODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback';

// Sandbox URLs
const BASE_URL = 'https://sandbox.safaricom.co.ke';
const AUTH_URL = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
const STK_PUSH_URL = `${BASE_URL}/mpesa/stkpush/v1/processrequest`;
const QUERY_URL = `${BASE_URL}/mpesa/stkpushquery/v1/query`;

/**
 * Generate OAuth Access Token
 */
export async function generateAccessToken(): Promise<string> {
  try {
    // Check if credentials exist
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      throw new Error('M-Pesa credentials not configured. Check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env.local');
    }

    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    console.log('Requesting M-Pesa access token...');
    
    const response = await axios.get(AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    console.log('Access token generated successfully');
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error generating access token:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to generate M-Pesa access token';
    if (error.response?.data) {
      errorMessage += ': ' + (error.response.data.error_description || JSON.stringify(error.response.data));
    } else if (error.message) {
      errorMessage += ': ' + error.message;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Generate Password for STK Push
 */
function generatePassword(): { password: string; timestamp: string } {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);
  
  const password = Buffer.from(
    `${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`
  ).toString('base64');

  return { password, timestamp };
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 * @param phoneNumber - Customer phone number (format: 254712345678)
 * @param amount - Amount to charge
 * @param accountReference - Account reference (e.g., Chama name)
 * @param transactionDesc - Transaction description
 */
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) {
  try {
    console.log('Initiating STK Push...');
    console.log('Phone:', phoneNumber, 'Amount:', amount);
    
    const accessToken = await generateAccessToken();
    const { password, timestamp } = generatePassword();

    // Format phone number (remove + if present)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    const payload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Must be integer
      PartyA: formattedPhone, // Customer phone
      PartyB: BUSINESS_SHORT_CODE, // Your paybill
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    console.log('STK Push Payload:', {
      ...payload,
      Password: '***HIDDEN***',
      CallBackURL: CALLBACK_URL
    });

    const response = await axios.post(STK_PUSH_URL, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('STK Push Response:', response.data);

    return {
      success: true,
      data: response.data,
      checkoutRequestID: response.data.CheckoutRequestID,
      merchantRequestID: response.data.MerchantRequestID,
    };
  } catch (error: any) {
    console.error('STK Push Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Extract meaningful error message
    let errorMessage = 'Failed to initiate STK Push';
    
    if (error.response?.data) {
      const data = error.response.data;
      errorMessage = data.errorMessage || data.message || JSON.stringify(data);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.response?.data
    };
  }
}

/**
 * Query STK Push Transaction Status
 * @param checkoutRequestID - The CheckoutRequestID from STK Push response
 */
export async function querySTKPushStatus(checkoutRequestID: string) {
  try {
    const accessToken = await generateAccessToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    };

    const response = await axios.post(QUERY_URL, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Query Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

/**
 * Process M-Pesa Callback
 * This function processes the callback from M-Pesa after STK Push
 */
export function processMpesaCallback(callbackData: any) {
  try {
    const { Body } = callbackData;
    const { stkCallback } = Body;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // ResultCode 0 means success
    if (ResultCode === 0) {
      const metadata = CallbackMetadata.Item;
      
      // Extract payment details
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      return {
        success: true,
        merchantRequestID: MerchantRequestID,
        checkoutRequestID: CheckoutRequestID,
        amount,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        resultDesc: ResultDesc,
      };
    } else {
      // Payment failed
      return {
        success: false,
        merchantRequestID: MerchantRequestID,
        checkoutRequestID: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      };
    }
  } catch (error: any) {
    console.error('Callback Processing Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
