import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await chatWithAI(message, context);

    return NextResponse.json({ 
      success: true, 
      response 
    });
  } catch (error: any) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat' },
      { status: 500 }
    );
  }
}
