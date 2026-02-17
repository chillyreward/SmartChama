import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface VoiceCommand {
  intent: string;
  action: string;
  parameters?: any;
  response: string;
}

export async function processVoiceCommand(
  audioText: string,
  userId: string,
  chamaId?: string
): Promise<VoiceCommand> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
You are a helpful assistant for SmartChama, a chama (savings group) management platform.
The user said: "${audioText}"

Analyze this command and respond with a JSON object containing:
- intent: The user's intention (check_balance, request_loan, view_transactions, create_chama, etc.)
- action: The specific action to take
- parameters: Any relevant parameters (amount, duration, etc.)
- response: A friendly response in the same language as the user's input

User ID: ${userId}
Chama ID: ${chamaId || "none"}

Respond ONLY with valid JSON, no other text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback response
    return {
      intent: "unknown",
      action: "none",
      response: "I didn't understand that. Can you try again?"
    };
  } catch (error) {
    console.error("Error processing voice command:", error);
    return {
      intent: "error",
      action: "none",
      response: "Sorry, I encountered an error. Please try again."
    };
  }
}

export async function textToSpeech(text: string): Promise<string> {
  // For now, return the text - browser will handle TTS
  // In production, integrate with Google Cloud TTS or similar
  return text;
}
