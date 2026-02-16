import { NextResponse } from 'next/server';
import { generateAccessToken } from '@/lib/mpesa';

export async function GET() {
  try {
    console.log('Testing M-Pesa credentials...');
    
    // Check environment variables
    const hasConsumerKey = !!process.env.MPESA_CONSUMER_KEY;
    const hasConsumerSecret = !!process.env.MPESA_CONSUMER_SECRET;
    const hasShortCode = !!process.env.MPESA_BUSINESS_SHORT_CODE;
    const hasPasskey = !!process.env.MPESA_PASSKEY;
    const hasCallbackUrl = !!process.env.MPESA_CALLBACK_URL;

    console.log('Environment check:', {
      hasConsumerKey,
      hasConsumerSecret,
      hasShortCode,
      hasPasskey,
      hasCallbackUrl,
      callbackUrl: process.env.MPESA_CALLBACK_URL
    });

    if (!hasConsumerKey || !hasConsumerSecret) {
      return NextResponse.json({
        success: false,
        error: 'M-Pesa credentials not configured',
        details: {
          hasConsumerKey,
          hasConsumerSecret,
          hasShortCode,
          hasPasskey,
          hasCallbackUrl
        }
      });
    }

    // Try to generate access token
    const accessToken = await generateAccessToken();
    
    return NextResponse.json({
      success: true,
      message: 'M-Pesa credentials are valid',
      tokenGenerated: !!accessToken,
      config: {
        hasConsumerKey,
        hasConsumerSecret,
        hasShortCode,
        hasPasskey,
        hasCallbackUrl,
        callbackUrl: process.env.MPESA_CALLBACK_URL
      }
    });
  } catch (error: any) {
    console.error('M-Pesa test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    }, { status: 500 });
  }
}
