import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Get phone number from query params
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({
        success: false,
        error: "Please provide phone number",
        usage: "Visit: /api/sms/test?phone=+254712345678"
      }, { status: 400 });
    }

    const testMessage = "🎉 SmartChama SMS Test\n\nIf you receive this, Africa's Talking integration is working!\n\nThank you!";

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phone,
        message: testMessage
      })
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "SMS test completed",
      phone: phone,
      result: result,
      note: "Check your phone for the test SMS!"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
