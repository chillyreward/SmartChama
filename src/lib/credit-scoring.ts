/**
 * Credit Scoring System for SmartChama
 * Analyzes member and chama financial behavior to generate credit scores
 */

export interface MemberCreditScore {
  memberId: string;
  memberName: string;
  score: number; // 0-850 (like FICO)
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  factors: {
    paymentHistory: number; // 35% weight
    contributionConsistency: number; // 30% weight
    loanRepayment: number; // 25% weight
    accountAge: number; // 10% weight
  };
  insights: string[];
  loanEligibility: {
    eligible: boolean;
    maxLoanAmount: number;
    recommendedAmount: number;
    interestRate: number;
  };
}

export interface ChamaCreditScore {
  chamaId: string;
  chamaName: string;
  score: number; // 0-1000
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
  healthMetrics: {
    memberRetention: number; // %
    averageMemberScore: number;
    totalSavings: number;
    activeMembers: number;
    defaultRate: number; // %
    growthRate: number; // %
  };
  riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  insights: string[];
  investmentReadiness: boolean;
}

/**
 * Calculate individual member credit score
 */
export function calculateMemberCreditScore(memberData: {
  memberId: string;
  memberName: string;
  joinedDate: string;
  transactions: any[];
  loans: any[];
  totalContributions: number;
  missedPayments: number;
  expectedPayments: number;
}): MemberCreditScore {
  const { transactions, loans, joinedDate, missedPayments, expectedPayments } = memberData;

  // 1. Payment History (35% weight) - Most important factor
  const paymentHistoryScore = calculatePaymentHistory(missedPayments, expectedPayments);

  // 2. Contribution Consistency (30% weight)
  const consistencyScore = calculateConsistency(transactions);

  // 3. Loan Repayment (25% weight)
  const loanRepaymentScore = calculateLoanRepayment(loans);

  // 4. Account Age (10% weight)
  const accountAgeScore = calculateAccountAge(joinedDate);

  // Weighted average
  const rawScore = 
    (paymentHistoryScore * 0.35) +
    (consistencyScore * 0.30) +
    (loanRepaymentScore * 0.25) +
    (accountAgeScore * 0.10);

  // Scale to 300-850 range (like FICO)
  const score = Math.round(300 + (rawScore * 5.5));

  // Determine grade
  const grade = getGrade(score);

  // Generate insights
  const insights = generateMemberInsights({
    paymentHistoryScore,
    consistencyScore,
    loanRepaymentScore,
    accountAgeScore,
    score
  });

  // Calculate loan eligibility
  const loanEligibility = calculateLoanEligibility(score, memberData.totalContributions);

  return {
    memberId: memberData.memberId,
    memberName: memberData.memberName,
    score,
    grade,
    factors: {
      paymentHistory: Math.round(paymentHistoryScore),
      contributionConsistency: Math.round(consistencyScore),
      loanRepayment: Math.round(loanRepaymentScore),
      accountAge: Math.round(accountAgeScore)
    },
    insights,
    loanEligibility
  };
}

/**
 * Calculate chama-level credit score
 */
export function calculateChamaCreditScore(chamaData: {
  chamaId: string;
  chamaName: string;
  createdDate: string;
  members: any[];
  transactions: any[];
  totalSavings: number;
  activeMembers: number;
  totalMembers: number;
}): ChamaCreditScore {
  const { members, transactions, totalSavings, activeMembers, totalMembers, createdDate } = chamaData;

  // Calculate member retention rate
  const memberRetention = (activeMembers / totalMembers) * 100;

  // Calculate average member credit score
  const memberScores = members.map(m => m.creditScore || 500);
  const averageMemberScore = memberScores.reduce((a, b) => a + b, 0) / memberScores.length;

  // Calculate default rate
  const loansWithDefaults = transactions.filter(t => 
    t.transaction_type === 'loan' && t.status === 'defaulted'
  ).length;
  const totalLoans = transactions.filter(t => t.transaction_type === 'loan').length;
  const defaultRate = totalLoans > 0 ? (loansWithDefaults / totalLoans) * 100 : 0;

  // Calculate growth rate (last 3 months vs previous 3 months)
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const recentDeposits = transactions.filter(t => 
    t.transaction_type === 'deposit' && 
    new Date(t.created_at) > threeMonthsAgo
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const previousDeposits = transactions.filter(t => 
    t.transaction_type === 'deposit' && 
    new Date(t.created_at) > sixMonthsAgo &&
    new Date(t.created_at) <= threeMonthsAgo
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const growthRate = previousDeposits > 0 
    ? ((recentDeposits - previousDeposits) / previousDeposits) * 100 
    : 0;

  // Calculate overall chama score (0-1000)
  const retentionScore = memberRetention * 2; // Max 200
  const memberScoreContribution = (averageMemberScore / 850) * 300; // Max 300
  const savingsScore = Math.min((totalSavings / 1000000) * 200, 200); // Max 200 at 1M
  const defaultPenalty = defaultRate * -5; // Penalty for defaults
  const growthBonus = Math.min(growthRate * 2, 100); // Max 100 bonus
  const ageBonus = calculateChamaAgeBonus(createdDate); // Max 200

  const rawScore = 
    retentionScore +
    memberScoreContribution +
    savingsScore +
    defaultPenalty +
    growthBonus +
    ageBonus;

  const score = Math.max(0, Math.min(1000, Math.round(rawScore)));

  // Determine rating
  const rating = getChamaRating(score);

  // Determine risk level
  const riskLevel = getRiskLevel(score, defaultRate);

  // Generate insights
  const insights = generateChamaInsights({
    score,
    memberRetention,
    averageMemberScore,
    defaultRate,
    growthRate,
    totalSavings
  });

  // Determine investment readiness
  const investmentReadiness = score >= 700 && defaultRate < 5 && memberRetention > 80;

  return {
    chamaId: chamaData.chamaId,
    chamaName: chamaData.chamaName,
    score,
    rating,
    healthMetrics: {
      memberRetention: Math.round(memberRetention * 10) / 10,
      averageMemberScore: Math.round(averageMemberScore),
      totalSavings,
      activeMembers,
      defaultRate: Math.round(defaultRate * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10
    },
    riskLevel,
    insights,
    investmentReadiness
  };
}

// Helper functions

function calculatePaymentHistory(missedPayments: number, expectedPayments: number): number {
  if (expectedPayments === 0) return 100;
  const paymentRate = ((expectedPayments - missedPayments) / expectedPayments) * 100;
  return Math.max(0, paymentRate);
}

function calculateConsistency(transactions: any[]): number {
  if (transactions.length < 2) return 50;

  const deposits = transactions
    .filter(t => t.transaction_type === 'deposit')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (deposits.length < 2) return 50;

  // Calculate variance in deposit amounts
  const amounts = deposits.map(d => parseFloat(d.amount));
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avg > 0 ? (stdDev / avg) : 1;

  // Lower variation = higher score
  const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 50));

  // Calculate time consistency (regular intervals)
  const intervals: number[] = [];
  for (let i = 1; i < deposits.length; i++) {
    const diff = new Date(deposits[i].created_at).getTime() - new Date(deposits[i-1].created_at).getTime();
    intervals.push(diff / (1000 * 60 * 60 * 24)); // Convert to days
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const intervalVariance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
  const intervalStdDev = Math.sqrt(intervalVariance);
  const intervalCV = avgInterval > 0 ? (intervalStdDev / avgInterval) : 1;

  const timeConsistency = Math.max(0, 100 - (intervalCV * 50));

  return (consistencyScore + timeConsistency) / 2;
}

function calculateLoanRepayment(loans: any[]): number {
  if (loans.length === 0) return 100; // No loans = perfect score

  const completedLoans = loans.filter(l => l.status === 'completed' || l.status === 'repaid');
  const defaultedLoans = loans.filter(l => l.status === 'defaulted');
  const lateLoans = loans.filter(l => l.status === 'late');

  const repaymentRate = (completedLoans.length / loans.length) * 100;
  const defaultPenalty = (defaultedLoans.length / loans.length) * 50;
  const latePenalty = (lateLoans.length / loans.length) * 25;

  return Math.max(0, repaymentRate - defaultPenalty - latePenalty);
}

function calculateAccountAge(joinedDate: string): number {
  const joined = new Date(joinedDate);
  const now = new Date();
  const monthsActive = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Score increases with age, maxing out at 24 months
  return Math.min(100, (monthsActive / 24) * 100);
}

function calculateChamaAgeBonus(createdDate: string): number {
  const created = new Date(createdDate);
  const now = new Date();
  const monthsActive = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Max 200 points at 36 months
  return Math.min(200, (monthsActive / 36) * 200);
}

function getGrade(score: number): MemberCreditScore['grade'] {
  if (score >= 800) return 'A+';
  if (score >= 740) return 'A';
  if (score >= 670) return 'B+';
  if (score >= 620) return 'B';
  if (score >= 580) return 'C+';
  if (score >= 550) return 'C';
  if (score >= 500) return 'D';
  return 'F';
}

function getChamaRating(score: number): ChamaCreditScore['rating'] {
  if (score >= 900) return 'AAA';
  if (score >= 850) return 'AA';
  if (score >= 800) return 'A';
  if (score >= 700) return 'BBB';
  if (score >= 600) return 'BB';
  if (score >= 500) return 'B';
  if (score >= 400) return 'CCC';
  if (score >= 300) return 'CC';
  if (score >= 200) return 'C';
  return 'D';
}

function getRiskLevel(score: number, defaultRate: number): ChamaCreditScore['riskLevel'] {
  if (score >= 800 && defaultRate < 2) return 'Very Low';
  if (score >= 700 && defaultRate < 5) return 'Low';
  if (score >= 600 && defaultRate < 10) return 'Medium';
  if (score >= 500 && defaultRate < 15) return 'High';
  return 'Very High';
}

function calculateLoanEligibility(score: number, totalContributions: number) {
  const eligible = score >= 550; // Minimum score for loan eligibility
  
  // Base multiplier on credit score
  let multiplier = 1;
  if (score >= 800) multiplier = 5;
  else if (score >= 740) multiplier = 4;
  else if (score >= 670) multiplier = 3;
  else if (score >= 620) multiplier = 2.5;
  else if (score >= 580) multiplier = 2;
  else if (score >= 550) multiplier = 1.5;

  const maxLoanAmount = totalContributions * multiplier;
  const recommendedAmount = maxLoanAmount * 0.7; // Conservative recommendation

  // Interest rate based on score
  let interestRate = 15; // Base rate
  if (score >= 800) interestRate = 5;
  else if (score >= 740) interestRate = 7;
  else if (score >= 670) interestRate = 9;
  else if (score >= 620) interestRate = 11;
  else if (score >= 580) interestRate = 13;

  return {
    eligible,
    maxLoanAmount: Math.round(maxLoanAmount),
    recommendedAmount: Math.round(recommendedAmount),
    interestRate
  };
}

function generateMemberInsights(factors: {
  paymentHistoryScore: number;
  consistencyScore: number;
  loanRepaymentScore: number;
  accountAgeScore: number;
  score: number;
}): string[] {
  const insights: string[] = [];

  if (factors.score >= 800) {
    insights.push('Excellent credit! You qualify for the best loan rates.');
  } else if (factors.score >= 670) {
    insights.push('Good credit standing. You have strong borrowing power.');
  } else if (factors.score >= 580) {
    insights.push('Fair credit. Focus on consistent payments to improve.');
  } else {
    insights.push('Poor credit. Rebuild by making regular contributions.');
  }

  if (factors.paymentHistoryScore < 80) {
    insights.push('Payment history needs improvement. Avoid missed payments.');
  }

  if (factors.consistencyScore < 70) {
    insights.push('Contribution amounts vary significantly. Try to maintain consistency.');
  }

  if (factors.loanRepaymentScore < 90 && factors.loanRepaymentScore > 0) {
    insights.push('Loan repayment history affects your score. Pay on time.');
  }

  if (factors.accountAgeScore < 50) {
    insights.push('New member. Your score will improve with time and activity.');
  }

  return insights;
}

function generateChamaInsights(metrics: {
  score: number;
  memberRetention: number;
  averageMemberScore: number;
  defaultRate: number;
  growthRate: number;
  totalSavings: number;
}): string[] {
  const insights: string[] = [];

  if (metrics.score >= 800) {
    insights.push('Exceptional chama health! Ready for institutional partnerships.');
  } else if (metrics.score >= 700) {
    insights.push('Strong chama performance. Good investment opportunities available.');
  } else if (metrics.score >= 600) {
    insights.push('Moderate health. Focus on member engagement and retention.');
  } else {
    insights.push('Chama needs attention. Address defaults and member activity.');
  }

  if (metrics.memberRetention < 80) {
    insights.push('Member retention is low. Improve engagement and benefits.');
  }

  if (metrics.defaultRate > 10) {
    insights.push('High default rate. Implement stricter loan approval criteria.');
  }

  if (metrics.growthRate > 20) {
    insights.push('Excellent growth! Savings increased significantly.');
  } else if (metrics.growthRate < 0) {
    insights.push('Negative growth. Review contribution requirements.');
  }

  if (metrics.averageMemberScore < 600) {
    insights.push('Average member credit is low. Provide financial literacy training.');
  }

  if (metrics.totalSavings > 1000000) {
    insights.push('Strong savings base. Consider diversified investments.');
  }

  return insights;
}
