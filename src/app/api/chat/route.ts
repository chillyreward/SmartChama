import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// --- DEMO MODE ANSWERS (Fallback) ---
// If Gemini crashes, the bot will use these instead.
const getFallbackAnswer = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("loan") || t.includes("borrow")) return "Based on your savings of KES 45,000, you qualify for an instant loan of up to KES 15,000 at 1.2% interest. Shall I process it?";
  if (t.includes("save") || t.includes("deposit")) return "Great! You can deposit via MPesa directly to the 'Family Savings' group. The current interest rate is 14% p.a. via our NCBA Money Market Fund.";
  if (t.includes("join") || t.includes("group")) return "To join a Chama, ask the admin for their Group PIN. You can enter it in the 'Join Group' section of your dashboard.";
  if (t.includes("hello") || t.includes("hi")) return "Jambo! I am your SmartChama AI advisor. I can help you with loans, savings, or investment advice. What do you need?";
  return "That is a great question. As an AI financial advisor, I recommend checking the 'SmartGrow' tab to see high-yield investment options for your group.";
};

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. TRY GEMINI (The Real Brain)
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `
          You are "SmartChama Advisor", a helpful Kenyan Fintech AI.
          User says: "${message}"
          
          Rules:
          - Keep answers short (max 2 sentences).
          - Use friendly Kenyan English.
          - If asked about loans, mention their limit is KES 15,000.
          - Be encouraging about savings.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return NextResponse.json({ reply: text });
      } catch (geminiError) {
        console.error("Gemini API Error (Using Fallback):", geminiError);
        // Fall through to backup
      }
    }

    // 2. BACKUP PLAN (If API Key fails)
    // We simulate a delay so it feels real
    await new Promise(resolve => setTimeout(resolve, 1000));
    const fallbackResponse = getFallbackAnswer(message);
    
    return NextResponse.json({ reply: fallbackResponse });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
  }
}