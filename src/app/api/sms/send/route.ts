import { NextResponse } from "next/server";
import { sms } from "@/lib/africastalking";

export async function POST(req: Request) {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { success: false, error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    console.log("📱 Sending SMS to:", phoneNumber);

    // Send SMS via Africa's Talking
    const result = await sms.send({
      to: [phoneNumber],
      message: message,
      from: process.env.AFRICASTALKING_SENDER_ID || undefined, // Optional: Your sender ID
    });

    console.log("✅ SMS sent:", result);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("❌ SMS Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}
