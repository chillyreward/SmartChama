import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface MemberRiskScore {
  memberId: string;
  riskScore: number; // 0-100 (higher is better)
  reliability: "high" | "medium" | "low";
  optimalLoanAmount: number;
  predictedBalance6Months: number;
  defaultRisk: number; // 0-100 (higher is worse)
  insights: string[];
}

export async function calculateMemberRiskScore(
  memberId: string,
  chamaId: string
): Promise<MemberRiskScore> {
  try {
    // Fetch member's transaction history
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("member_id", memberId)
      .eq("chama_id", chamaId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch member details
    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .single();

    // Fetch chama average contribution
    const { data: chamaMembers } = await supabase
      .from("members")
      .select("total_contributions")
      .eq("chama_id", chamaId);

    const avgContribution = chamaMembers
      ? chamaMembers.reduce((sum, m) => sum + (m.total_contributions || 0), 0) / chamaMembers.length
      : 0;

    // Calculate basic metrics
    const totalContributions = member?.total_contributions || 0;
    const transactionCount = transactions?.length || 0;
    const recentTransactions = transactions?.slice(0, 10) || [];

    // Calculate consistency (transactions per month)
    const monthsActive = member?.created_at
      ? Math.max(1, Math.floor((Date.now() - new Date(member.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)))
      : 1;
    const transactionsPerMonth = transactionCount / monthsActive;

    // Calculate contribution trend
    const contributionTrend = totalContributions > avgContribution ? "above" : "below";

    // Use AI to generate insights
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
Analyze this chama member's financial behavior and provide risk assessment:

Member Stats:
- Total Contributions: KES ${totalContributions}
- Transaction Count: ${transactionCount}
- Months Active: ${monthsActive}
- Transactions per Month: ${transactionsPerMonth.toFixed(1)}
- Contribution vs Average: ${contributionTrend} (avg: KES ${avgContribution.toFixed(0)})

Recent Transactions: ${JSON.stringify(recentTransactions.slice(0, 5))}

Provide a JSON response with:
- riskScore: 0-100 (higher is better, based on consistency and contribution history)
- optimalLoanAmount: Suggested safe loan amount in KES
- predictedBalance6Months: Predicted balance in 6 months
- defaultRisk: 0-100 (probability of default, higher is worse)
- insights: Array of 3-4 brief insights about this member

Respond ONLY with valid JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let aiAnalysis: any = {};

    if (jsonMatch) {
      aiAnalysis = JSON.parse(jsonMatch[0]);
    }

    // Calculate final risk score (combine AI + rule-based)
    const baseScore = Math.min(100, (transactionsPerMonth * 10) + (totalContributions / 1000));
    const finalRiskScore = aiAnalysis.riskScore || baseScore;

    const reliability: "high" | "medium" | "low" =
      finalRiskScore >= 70 ? "high" : finalRiskScore >= 40 ? "medium" : "low";

    return {
      memberId,
      riskScore: Math.round(finalRiskScore),
      reliability,
      optimalLoanAmount: aiAnalysis.optimalLoanAmount || Math.round(totalContributions * 0.5),
      predictedBalance6Months: aiAnalysis.predictedBalance6Months || Math.round(totalContributions * 1.3),
      defaultRisk: aiAnalysis.defaultRisk || Math.round(100 - finalRiskScore),
      insights: aiAnalysis.insights || [
        `${transactionsPerMonth.toFixed(1)} transactions per month`,
        `${contributionTrend} average contributions`,
        `${monthsActive} months active in chama`,
      ],
    };
  } catch (error) {
    console.error("Error calculating risk score:", error);
    
    // Return default safe values
    return {
      memberId,
      riskScore: 50,
      reliability: "medium",
      optimalLoanAmount: 5000,
      predictedBalance6Months: 10000,
      defaultRisk: 50,
      insights: ["Insufficient data for detailed analysis"],
    };
  }
}

export async function getChamaHealthScore(chamaId: string): Promise<{
  healthScore: number;
  totalMembers: number;
  activeMembers: number;
  totalBalance: number;
  monthlyGrowth: number;
  insights: string[];
}> {
  try {
    // Fetch chama data
    const { data: chama } = await supabase
      .from("chamas")
      .select("*")
      .eq("id", chamaId)
      .single();

    const { data: members } = await supabase
      .from("members")
      .select("*")
      .eq("chama_id", chamaId);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("chama_id", chamaId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalMembers = members?.length || 0;
    const activeMembers = members?.filter(m => (m.total_contributions || 0) > 0).length || 0;
    const totalBalance = members?.reduce((sum, m) => sum + (m.total_contributions || 0), 0) || 0;

    // Calculate health score
    const membershipScore = Math.min(100, (totalMembers / 20) * 100);
    const activityScore = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;
    const balanceScore = Math.min(100, (totalBalance / 100000) * 100);
    const healthScore = Math.round((membershipScore + activityScore + balanceScore) / 3);

    return {
      healthScore,
      totalMembers,
      activeMembers,
      totalBalance,
      monthlyGrowth: chama?.monthly_growth || 0,
      insights: [
        `${activeMembers}/${totalMembers} members are active`,
        `Total balance: KES ${totalBalance.toLocaleString()}`,
        `Health score: ${healthScore}/100`,
      ],
    };
  } catch (error) {
    console.error("Error calculating chama health:", error);
    return {
      healthScore: 0,
      totalMembers: 0,
      activeMembers: 0,
      totalBalance: 0,
      monthlyGrowth: 0,
      insights: ["Unable to calculate health score"],
    };
  }
}
