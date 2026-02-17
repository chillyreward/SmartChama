import { NextRequest, NextResponse } from "next/server";
import { processVoiceCommand } from "@/lib/gemini-voice";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { audioText, userId, chamaId } = await request.json();

    if (!audioText) {
      return NextResponse.json(
        { error: "Audio text is required" },
        { status: 400 }
      );
    }

    // Process the voice command
    const result = await processVoiceCommand(audioText, userId, chamaId);

    // Execute the action based on intent
    let actionResult: any = null;

    switch (result.intent) {
      case "check_balance":
        if (userId) {
          const { data: member } = await supabase
            .from("members")
            .select("total_contributions")
            .eq("user_id", userId)
            .single();

          actionResult = {
            balance: member?.total_contributions || 0,
          };
        }
        break;

      case "request_loan":
        // Handle loan request
        actionResult = {
          message: "Loan request received. Admin will review shortly.",
        };
        break;

      case "view_transactions":
        if (userId && chamaId) {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("*")
            .eq("member_id", userId)
            .eq("chama_id", chamaId)
            .order("created_at", { ascending: false })
            .limit(5);

          actionResult = {
            transactions: transactions || [],
          };
        }
        break;

      default:
        actionResult = { message: "Command processed" };
    }

    return NextResponse.json({
      success: true,
      intent: result.intent,
      action: result.action,
      response: result.response,
      data: actionResult,
    });
  } catch (error) {
    console.error("Voice AI error:", error);
    return NextResponse.json(
      { error: "Failed to process voice command" },
      { status: 500 }
    );
  }
}
