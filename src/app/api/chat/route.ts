import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are SmartChama Assistant, the official AI helper for SmartChama — a Kenyan digital savings group (chama) platform.

Your ONLY purpose is to help users with SmartChama-related topics:
- Contributions: how to contribute, M-Pesa payments, contribution schedules, late payments
- Loans: applying, eligibility, credit scores, repayment, interest rates
- Credit scores: what they are, how they are calculated, how to improve them
- Group management: creating groups, adding members, invite codes, group rules, admin features
- Platform features: dashboards, wallets, SmartGrow investments, transactions, notifications
- M-Pesa integration: STK push, paybill, till numbers
- Account management: signup, login, profile, settings
- General chama advice for Kenyan savings groups

STRICT RULES:
1. If a question is NOT related to SmartChama or chama savings groups, decline and redirect.
2. Do NOT answer questions about general topics like news, weather, coding, math, history, other apps, politics, sports, or anything unrelated to SmartChama.
3. Keep responses concise, helpful, and friendly.
4. Use simple English with Kenyan context (KSh, M-Pesa, county) where relevant.
5. Never make up account details or features that don't exist on SmartChama.

When asked something off-topic, always respond with:
"I can only help with SmartChama-related questions — things like contributions, loans, credit scores, group management, and M-Pesa payments. For other topics, please use a general search engine."`

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Build messages array with conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.'

    return NextResponse.json({ reply })

  } catch (err: any) {
    console.error('Chat API error:', err)
    if (err?.status === 401) {
      return NextResponse.json({ error: 'Invalid OpenAI API key' }, { status: 500 })
    }
    if (err?.status === 429) {
      return NextResponse.json({ error: 'Rate limit reached. Please try again in a moment.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to get response. Please try again.' }, { status: 500 })
  }
}
