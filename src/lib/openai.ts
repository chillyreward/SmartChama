import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate AI-powered financial advice
 */
export async function getFinancialAdvice(chamaData: {
  totalBalance: number;
  monthlyContributions: number;
  activeLoans: number;
  memberCount: number;
}) {
  try {
    const prompt = `As a financial advisor for a Chama (savings group) in Kenya, provide brief advice based on:
- Total Balance: KES ${chamaData.totalBalance.toLocaleString()}
- Monthly Contributions: KES ${chamaData.monthlyContributions.toLocaleString()}
- Active Loans: ${chamaData.activeLoans}
- Members: ${chamaData.memberCount}

Provide 3 actionable tips to improve their financial health. Keep it concise and practical.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Unable to generate advice at this time.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI service failed: ${error.message}`);
  }
}

/**
 * Analyze spending patterns and provide insights
 */
export async function analyzeSpendingPatterns(transactions: Array<{
  type: string;
  amount: number;
  date: string;
}>) {
  try {
    const transactionSummary = transactions.map(t => 
      `${t.type}: KES ${t.amount} on ${t.date}`
    ).join('\n');

    const prompt = `Analyze these Chama transactions and provide insights:
${transactionSummary}

Identify patterns, risks, and opportunities. Keep response under 200 words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Unable to analyze patterns.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/**
 * Generate personalized contribution reminder message
 */
export async function generateReminderMessage(memberName: string, amount: number, daysOverdue: number) {
  try {
    const prompt = `Generate a friendly but firm reminder message for ${memberName} who owes KES ${amount} and is ${daysOverdue} days overdue. Keep it under 50 words and culturally appropriate for Kenya.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.8,
    });

    return response.choices[0].message.content || `Hi ${memberName}, your contribution of KES ${amount} is ${daysOverdue} days overdue. Please pay soon.`;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return `Hi ${memberName}, your contribution of KES ${amount} is ${daysOverdue} days overdue. Please pay soon.`;
  }
}

/**
 * Chat with AI assistant about Chama queries
 */
export async function chatWithAI(userMessage: string, context?: string) {
  try {
    const systemPrompt = `You are a helpful AI assistant for SmartChama, a Kenyan savings group management platform. 
${context ? `Context: ${context}` : ''}
Provide clear, concise answers about chama management, savings, loans, and financial planning in Kenya.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'I apologize, I could not process your request.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI chat failed: ${error.message}`);
  }
}

/**
 * Predict loan default risk
 */
export async function predictLoanRisk(memberData: {
  contributionHistory: number[];
  loanHistory: number;
  missedPayments: number;
  membershipDuration: number;
}) {
  try {
    const prompt = `Assess loan default risk for a chama member:
- Contribution History (last 6 months): ${memberData.contributionHistory.join(', ')}
- Previous Loans: ${memberData.loanHistory}
- Missed Payments: ${memberData.missedPayments}
- Membership Duration: ${memberData.membershipDuration} months

Provide risk level (Low/Medium/High) and brief explanation.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.5,
    });

    return response.choices[0].message.content || 'Unable to assess risk.';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`Risk assessment failed: ${error.message}`);
  }
}
