import { NextRequest, NextResponse } from 'next/server';
import { getFinancialAdvice } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { totalBalance, monthlyContributions, activeLoans, memberCount } = await request.json();

    if (!totalBalance || !monthlyContributions || activeLoans === undefined || !memberCount) {
      return NextResponse.json(
        { error: 'All chama data fields are required' },
        { status: 400 }
      );
    }

    const advice = await getFinancialAdvice({
      totalBalance,
      monthlyContributions,
      activeLoans,
      memberCount
    });

    return NextResponse.json({ 
      success: true, 
      advice 
    });
  } catch (error: any) {
    console.error('AI Advice API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate advice' },
      { status: 500 }
    );
  }
}
