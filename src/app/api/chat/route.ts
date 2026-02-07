import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // This is the "Persona" - It tells the AI how to behave
    const prompt = `
      You are the "SmartChama Advisor", a helpful AI for a Kenyan Fintech app.
      Your goal is to help users manage their Chama (Group Savings).
      
      User Question: ${message}
      
      Guidelines:
      1. Be short, friendly, and professional.
      2. Use Kenyan slang occasionally (like "sawa", "pole", "pesa").
      3. Focus on financial advice, savings, and loans.
      4. If asked about their balance, say you can't see it yet but suggest checking the Dashboard.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
  }
}