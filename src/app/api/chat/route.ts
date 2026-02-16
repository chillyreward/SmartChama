import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// --- SMARTCHAMA KNOWLEDGE BASE (Fallback) ---
// If Gemini API is unavailable, use these SmartChama-specific answers
const getFallbackAnswer = (text: string) => {
  const t = text.toLowerCase();
  
  // Loan queries
  if (t.includes("loan") || t.includes("borrow")) {
    return "To check your loan eligibility, go to the Loans section in your dashboard. SmartChama typically allows loans up to 3x your total contributions at 1.2% monthly interest. Your loan limit is calculated based on your contribution history.";
  }
  
  // Savings and deposits
  if (t.includes("save") || t.includes("deposit") || t.includes("contribute")) {
    return "You can deposit funds via M-Pesa by clicking the 'Deposit' button on your dashboard. Enter your M-Pesa number and amount, then approve the STK push on your phone. Contributions are tracked in real-time and reflect immediately in your chama balance.";
  }
  
  // Joining or creating chamas
  if (t.includes("join") || t.includes("create") || t.includes("chama")) {
    return "To join a chama, you need an invite link from an admin. To create your own chama, go to 'My Chamas' and click 'Create New Chama'. You'll set the name, investment goal, and monthly growth target. Then invite members using the generated invite links.";
  }
  
  // Inviting members
  if (t.includes("invite") || t.includes("member") || t.includes("add")) {
    return "To invite members, click the 'Invite' button on your admin dashboard, select your chama, and generate an invite link. Share this link with potential members - they can sign up and will be automatically added to your chama. Each invite link can be used up to 30 times.";
  }
  
  // M-Pesa integration
  if (t.includes("mpesa") || t.includes("payment") || t.includes("stk")) {
    return "SmartChama uses M-Pesa STK Push for seamless deposits. When you click 'Deposit', you'll receive a prompt on your phone to enter your M-Pesa PIN. The transaction is instant and secure, with all deposits tracked in your transaction history.";
  }
  
  // Investment and SmartGrow
  if (t.includes("invest") || t.includes("smartgrow") || t.includes("return")) {
    return "SmartGrow offers AI-recommended investment opportunities including Money Market Funds (10-14% returns), Treasury Bills (12-16% returns), and group investment options. Check the SmartGrow section to see personalized recommendations based on your chama's goals.";
  }
  
  // Analytics and tracking
  if (t.includes("analytic") || t.includes("track") || t.includes("report") || t.includes("performance")) {
    return "View detailed analytics in the Analytics section of your dashboard. Track member contributions, chama growth trends, transaction history, and investment performance. Admins can export reports to CSV for detailed analysis (Pro feature).";
  }
  
  // Security
  if (t.includes("secure") || t.includes("safe") || t.includes("pin") || t.includes("protect")) {
    return "SmartChama uses bank-grade AES-256 encryption to protect your data. Sensitive operations require PIN verification. Your M-Pesa transactions are processed securely through Safaricom's Daraja API. We never store your M-Pesa PIN.";
  }
  
  // Greetings
  if (t.includes("hello") || t.includes("hi") || t.includes("hey") || t.includes("jambo")) {
    return "Jambo! I'm your SmartChama AI Advisor. I can help you with chama management, M-Pesa deposits, loans, member invitations, investments, and analytics. What would you like to know?";
  }
  
  // Help or general
  if (t.includes("help") || t.includes("how") || t.includes("what")) {
    return "I can assist you with: creating/managing chamas, inviting members, making M-Pesa deposits, checking loan eligibility, viewing analytics, and exploring SmartGrow investments. What specific feature would you like to learn about?";
  }
  
  // Default response
  return "That's a great question! SmartChama offers comprehensive chama management tools including M-Pesa integration, automated tracking, and AI-powered insights. Could you be more specific about what you'd like to know? I can help with deposits, loans, invitations, or investments.";
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
          You are "SmartChama AI Advisor", an expert financial assistant for SmartChama - a Kenyan digital chama (investment group) management platform.
          
          ABOUT SMARTCHAMA:
          - SmartChama is a digital platform for managing chamas (traditional Kenyan savings and investment groups)
          - Features: M-Pesa integration, automated contributions, loan management, investment tracking, AI-powered insights
          - Users can create chamas, invite members, track savings, request loans, and invest collectively
          - Platform supports multiple chamas per user, secure PIN protection, and real-time transaction tracking
          
          KEY FEATURES:
          1. Chama Management: Create and manage multiple investment groups
          2. M-Pesa Integration: Seamless deposits and withdrawals via M-Pesa STK Push
          3. Member Invitations: Generate secure invite links for new members
          4. Loan System: Members can borrow against their savings (typically up to 3x their contribution)
          5. SmartGrow: AI-recommended investment opportunities and portfolio management
          6. Analytics: Track group performance, member contributions, and growth trends
          7. Security: Bank-grade AES-256 encryption, PIN protection for sensitive operations
          
          TYPICAL LOAN TERMS:
          - Interest rate: 1.2% per month (14.4% annually)
          - Loan limit: Usually 2-3x member's total contributions
          - Repayment period: Flexible, typically 1-12 months
          
          INVESTMENT OPTIONS (SmartGrow):
          - Money Market Funds: 10-14% annual returns
          - Treasury Bills: 12-16% annual returns
          - Group investments: Real estate, business ventures
          
          USER CONTEXT:
          User says: "${message}"
          
          RESPONSE GUIDELINES:
          - Keep answers concise (2-3 sentences max)
          - Use friendly, professional Kenyan English
          - Reference actual SmartChama features when relevant
          - For loans: mention checking their contribution history first
          - For savings: encourage consistent contributions
          - For technical issues: guide them to specific dashboard sections
          - Be encouraging and supportive about financial goals
          - Use local context (KES currency, M-Pesa, Kenyan investment options)
          
          Provide a helpful, accurate response:
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