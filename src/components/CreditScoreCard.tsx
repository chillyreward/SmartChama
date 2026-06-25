"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Shield, AlertCircle, CheckCircle, Award } from 'lucide-react';

interface CreditScoreCardProps {
  type: 'member' | 'chama';
  id: string;
}

export default function CreditScoreCard({ type, id }: CreditScoreCardProps) {
  const [loading, setLoading] = useState(true);
  const [creditScore, setCreditScore] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCreditScore();
  }, [type, id]);

  const fetchCreditScore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/credit-score?type=${type}&id=${id}`);
      const data = await response.json();

      if (data.success) {
        setCreditScore(data.creditScore);
      } else {
        setError(data.error || 'Failed to fetch credit score');
      }
    } catch (err) {
      console.error('Error fetching credit score:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !creditScore) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error || 'No credit score available'}</span>
        </div>
      </div>
    );
  }

  if (type === 'member') {
    return <MemberCreditScoreCard creditScore={creditScore} />;
  } else {
    return <ChamaCreditScoreCard creditScore={creditScore} />;
  }
}

function MemberCreditScoreCard({ creditScore }: { creditScore: any }) {
  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-emerald-400';
    if (score >= 670) return 'text-blue-400';
    if (score >= 580) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Credit Score</h3>
            <p className="text-slate-400 text-xs">Financial Health Rating</p>
          </div>
        </div>
        <div className={`px-3 py-1 ${getGradeColor(creditScore.grade)} rounded-full text-white text-sm font-bold`}>
          {creditScore.grade}
        </div>
      </div>

      {/* Score Display */}
      <div className="text-center py-6">
        <div className={`text-6xl font-black ${getScoreColor(creditScore.score)}`}>
          {creditScore.score}
        </div>
        <div className="text-slate-500 text-sm mt-2">out of 850</div>
        
        {/* Score Bar */}
        <div className="mt-6 h-3 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getScoreColor(creditScore.score).replace('text-', 'bg-')} transition-all duration-1000`}
            style={{ width: `${(creditScore.score / 850) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-3">
        <h4 className="text-white font-bold text-sm">Score Factors</h4>
        
        <div className="space-y-2">
          <ScoreFactor 
            label="Payment History" 
            score={creditScore.factors.paymentHistory} 
            weight="35%"
          />
          <ScoreFactor 
            label="Contribution Consistency" 
            score={creditScore.factors.contributionConsistency} 
            weight="30%"
          />
          <ScoreFactor 
            label="Loan Repayment" 
            score={creditScore.factors.loanRepayment} 
            weight="25%"
          />
          <ScoreFactor 
            label="Account Age" 
            score={creditScore.factors.accountAge} 
            weight="10%"
          />
        </div>
      </div>

      {/* Loan Eligibility */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          {creditScore.loanEligibility.eligible ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-white font-bold text-sm">
            {creditScore.loanEligibility.eligible ? 'Loan Eligible' : 'Not Eligible'}
          </span>
        </div>
        
        {creditScore.loanEligibility.eligible && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Max Loan:</span>
              <span className="text-white font-bold">
                KES {creditScore.loanEligibility.maxLoanAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Recommended:</span>
              <span className="text-emerald-400 font-bold">
                KES {creditScore.loanEligibility.recommendedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Interest Rate:</span>
              <span className="text-white font-bold">
                {creditScore.loanEligibility.interestRate}% p.a.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="space-y-2">
        {creditScore.insights.map((insight: string, index: number) => (
          <div key={index} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-950/30 p-3 rounded-lg">
            <span className="mt-0.5">•</span>
            <span>{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChamaCreditScoreCard({ creditScore }: { creditScore: any }) {
  const getRatingColor = (rating: string) => {
    if (rating.startsWith('AA')) return 'text-emerald-400';
    if (rating.startsWith('A') || rating === 'BBB') return 'text-blue-400';
    if (rating.startsWith('B')) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    if (risk.includes('Very Low') || risk === 'Low') return 'text-emerald-400';
    if (risk === 'Medium') return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Chama Credit Rating</h3>
            <p className="text-slate-400 text-xs">Group Health Score</p>
          </div>
        </div>
        <div className={`px-3 py-1 bg-amber-500 rounded-full text-white text-sm font-bold`}>
          {creditScore.rating}
        </div>
      </div>

      {/* Score Display */}
      <div className="text-center py-6">
        <div className={`text-6xl font-black ${getRatingColor(creditScore.rating)}`}>
          {creditScore.score}
        </div>
        <div className="text-slate-500 text-sm mt-2">out of 1000</div>
        
        {/* Score Bar */}
        <div className="mt-6 h-3 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getRatingColor(creditScore.rating).replace('text-', 'bg-')} transition-all duration-1000`}
            style={{ width: `${(creditScore.score / 1000) * 100}%` }}
          ></div>
        </div>

        {/* Risk Level */}
        <div className="mt-4">
          <span className="text-slate-400 text-sm">Risk Level: </span>
          <span className={`font-bold ${getRiskColor(creditScore.riskLevel)}`}>
            {creditScore.riskLevel}
          </span>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          label="Member Retention" 
          value={`${creditScore.healthMetrics.memberRetention}%`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard 
          label="Avg Member Score" 
          value={creditScore.healthMetrics.averageMemberScore}
          icon={<Shield className="w-4 h-4" />}
        />
        <MetricCard 
          label="Total Savings" 
          value={`KES ${(creditScore.healthMetrics.totalSavings / 1000).toFixed(0)}K`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard 
          label="Default Rate" 
          value={`${creditScore.healthMetrics.defaultRate}%`}
          icon={creditScore.healthMetrics.defaultRate > 10 ? <TrendingDown className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        />
        <MetricCard 
          label="Active Members" 
          value={creditScore.healthMetrics.activeMembers}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard 
          label="Growth Rate" 
          value={`${creditScore.healthMetrics.growthRate > 0 ? '+' : ''}${creditScore.healthMetrics.growthRate}%`}
          icon={creditScore.healthMetrics.growthRate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        />
      </div>

      {/* Investment Readiness */}
      <div className={`border rounded-xl p-4 ${
        creditScore.investmentReadiness 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-slate-950/50 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {creditScore.investmentReadiness ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-white font-bold text-sm">
            {creditScore.investmentReadiness ? 'Investment Ready' : 'Not Investment Ready'}
          </span>
        </div>
        <p className="text-slate-400 text-xs">
          {creditScore.investmentReadiness 
            ? 'This chama qualifies for institutional partnerships and investment opportunities.'
            : 'Improve score, retention, and reduce defaults to access investment opportunities.'}
        </p>
      </div>

      {/* Insights */}
      <div className="space-y-2">
        {creditScore.insights.map((insight: string, index: number) => (
          <div key={index} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-950/30 p-3 rounded-lg">
            <span className="mt-0.5">•</span>
            <span>{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreFactor({ label, score, weight }: { label: string; score: number; weight: string }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500">{weight}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-white font-bold text-lg">{value}</div>
    </div>
  );
}
