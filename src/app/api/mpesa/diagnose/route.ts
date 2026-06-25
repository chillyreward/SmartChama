import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      hasConsumerKey: !!process.env.MPESA_CONSUMER_KEY,
      hasConsumerSecret: !!process.env.MPESA_CONSUMER_SECRET,
      hasShortCode: !!process.env.MPESA_BUSINESS_SHORT_CODE,
      hasPasskey: !!process.env.MPESA_PASSKEY,
      hasCallbackUrl: !!process.env.MPESA_CALLBACK_URL,
      shortCode: process.env.MPESA_BUSINESS_SHORT_CODE || 'NOT SET',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'NOT SET',
    },
    checks: {
      credentialsConfigured: !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET),
      callbackIsHttps: process.env.MPESA_CALLBACK_URL?.startsWith('https://') || false,
      shortCodeValid: process.env.MPESA_BUSINESS_SHORT_CODE === '174379',
    },
    recommendations: [] as string[]
  };

  // Add recommendations
  if (!diagnostics.checks.credentialsConfigured) {
    diagnostics.recommendations.push('️ Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env.local');
  }
  
  if (!diagnostics.checks.callbackIsHttps) {
    diagnostics.recommendations.push('️ MPESA_CALLBACK_URL must be HTTPS. Use ngrok or webhook.site for local testing');
  }
  
  if (!diagnostics.checks.shortCodeValid) {
    diagnostics.recommendations.push('️ For sandbox, use MPESA_BUSINESS_SHORT_CODE=174379');
  }

  if (diagnostics.recommendations.length === 0) {
    diagnostics.recommendations.push(' Configuration looks good! Try testing with /api/mpesa/test');
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
