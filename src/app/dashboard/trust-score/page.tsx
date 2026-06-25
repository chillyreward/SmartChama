'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HistoryEntry {
  date: string
  score: number
}

export default function TrustScorePage() {
  const { member, isLoading } = useAuth()
  const [scoreHistory, setScoreHistory] = useState<HistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const score = member?.trust_score ?? 60
  const streak = member?.contribution_streak ?? 0

  // Calculate scores out of maximums
  const contributionScore = Math.round((score * 0.4))
  const repaymentScore = Math.round((score * 0.3))
  const tenureScore = Math.round((score * 0.2))
  const participationScore = Math.round((score * 0.1))

  const getStatusLabel = (val: number) => {
    if (val < 40) return { label: 'Limited', color: 'text-red-500 bg-red-50 dark:bg-red-950/20' }
    if (val < 60) return { label: 'Fair', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
    if (val < 80) return { label: 'Good', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' }
    return { label: 'Excellent', color: 'text-green-500 bg-green-50 dark:bg-green-950/20' }
  }

  const status = getStatusLabel(score)

  // Circular gauge config
  const strokeWidth = 12
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  useEffect(() => {
    async function fetchScoreHistory() {
      if (!member?.id) return
      try {
        setLoadingHistory(true)
        const { data, error } = await supabase
          .from('audit_log')
          .select('created_at, details')
          .eq('profile_id', member.user_id)
          .order('created_at', { ascending: true })
          .limit(20)

        if (!error && data) {
          const parsed = data
            .map(d => {
              let scoreVal = score
              try {
                const detailObj = typeof d.details === 'string' ? JSON.parse(d.details) : d.details
                scoreVal = detailObj?.new_score ?? detailObj?.trust_score ?? score
              } catch {}
              return {
                date: new Date(d.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
                score: scoreVal
              }
            })
          setScoreHistory(parsed)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingHistory(false)
      }
    }

    if (!isLoading && member) {
      fetchScoreHistory()
    }
  }, [isLoading, member])

  return (
    <div className="max-w-4xl p-4 md:p-8 font-inter text-[var(--text-main)]">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Trust Score</span>
        </p>
        
        <h1 className="text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Your Trust Score
        </h1>
        <p className="text-[14px] text-[var(--text-muted)] mt-1">
          Your financial reputation score is verified on-chain to unlock flexible lending terms.
        </p>
      </div>

      {/* Top Arc and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-center card-bg border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
        {/* Circular gauge */}
        <div className="flex justify-center md:justify-start">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-gray-100 dark:stroke-gray-800"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-[#22C55E]"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[44px] font-bold text-[var(--text-main)] leading-none font-geist">
                {score}
              </span>
              <span className="text-[12px] text-[var(--text-muted)] font-medium mt-1">
                Out of 100
              </span>
            </div>
          </div>
        </div>

        {/* Stats info */}
        <div className="md:col-span-2 space-y-4 text-center md:text-left">
          <div>
            <span className={`px-3 py-1 rounded-full text-[13px] font-semibold tracking-wide uppercase ${status.color}`}>
              {status.label} Reputation
            </span>
          </div>
          <h2 className="text-[20px] font-bold text-[var(--text-main)] font-geist">
            Chama Credit Standing
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-md">
            Your score is computed in real-time based on contribution streak, loan repayment punctuality, group tenure, and active participation.
          </p>
          <div className="flex gap-4 justify-center md:justify-start pt-2">
            <div className="bg-gray-50 dark:bg-[#1a2218] px-4 py-2 rounded-lg border border-[var(--border)]">
              <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">Streak</div>
              <div className="text-[16px] font-bold text-[var(--brand-green)] font-mono">{streak} months</div>
            </div>
            <div className="bg-gray-50 dark:bg-[#1a2218] px-4 py-2 rounded-lg border border-[var(--border)]">
              <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">Decentralized Trust</div>
              <div className="text-[16px] font-bold text-[var(--brand-green)] font-mono">100% Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown cards */}
      <h3 className="text-[16px] font-bold text-[var(--text-main)] mb-4 font-geist">
        Trust Score Breakdown
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="card-bg border border-[var(--border)] p-3 md:p-4 rounded-2xl shadow-xs">
          <span className="material-symbols-outlined text-[#22C55E] text-[24px]">payments</span>
          <h4 className="text-[13px] font-bold text-[var(--text-main)] mt-2">Contributions</h4>
          <div className="text-[18px] font-extrabold text-[var(--brand-green)] font-mono mt-1">
            {contributionScore} <span className="text-[12px] text-[var(--text-muted)] font-normal">/ 40</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
            Based on monthly contributions paid on time.
          </p>
        </div>

        <div className="card-bg border border-[var(--border)] p-3 md:p-4 rounded-2xl shadow-xs">
          <span className="material-symbols-outlined text-[#22C55E] text-[24px]">account_balance</span>
          <h4 className="text-[13px] font-bold text-[var(--text-main)] mt-2">Repayment Rate</h4>
          <div className="text-[18px] font-extrabold text-[var(--brand-green)] font-mono mt-1">
            {repaymentScore} <span className="text-[12px] text-[var(--text-muted)] font-normal">/ 30</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
            Based on loan repayments punctuality.
          </p>
        </div>

        <div className="card-bg border border-[var(--border)] p-3 md:p-4 rounded-2xl shadow-xs">
          <span className="material-symbols-outlined text-[#22C55E] text-[24px]">calendar_today</span>
          <h4 className="text-[13px] font-bold text-[var(--text-main)] mt-2">Group Tenure</h4>
          <div className="text-[18px] font-extrabold text-[var(--brand-green)] font-mono mt-1">
            {tenureScore} <span className="text-[12px] text-[var(--text-muted)] font-normal">/ 20</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
            Increases with the duration of your membership.
          </p>
        </div>

        <div className="card-bg border border-[var(--border)] p-3 md:p-4 rounded-2xl shadow-xs">
          <span className="material-symbols-outlined text-[#22C55E] text-[24px]">military_tech</span>
          <h4 className="text-[13px] font-bold text-[var(--text-main)] mt-2">Participation</h4>
          <div className="text-[18px] font-extrabold text-[var(--brand-green)] font-mono mt-1">
            {participationScore} <span className="text-[12px] text-[var(--text-muted)] font-normal">/ 10</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
            Earned by continuous contribution streak.
          </p>
        </div>
      </div>

      {/* History Chart */}
      <div className="card-bg border border-[var(--border)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 mb-8">
        <h3 className="text-[16px] font-bold text-[var(--text-main)] mb-6 font-geist">
          Score History Trend
        </h3>
        {loadingHistory ? (
          <div className="flex justify-center h-48 items-center">
            <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : scoreHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 dark:bg-[#1a2218] rounded-xl p-4">
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-650 text-[36px] mb-2">timeline</span>
            <p className="text-[13px] text-[var(--text-muted)]">
              Your score history will appear here as you contribute over time.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={200} className="md:h-[300px]">
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Points`, 'Score']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Benefits & How to improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="card-bg border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
          <h3 className="text-[16px] font-bold text-[var(--text-main)] mb-4 font-geist flex items-center gap-2">
            <span className="material-symbols-outlined text-[#22C55E]">lock_open</span>
            What your score unlocks
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[13px] border-b border-gray-100 dark:border-[#2d3d2d] pb-2">
              <span className="text-[var(--text-muted)]">0-39: Limited</span>
              <span className="text-red-500 font-semibold font-mono">Loans unavailable</span>
            </div>
            <div className="flex justify-between items-center text-[13px] border-b border-gray-100 dark:border-[#2d3d2d] pb-2">
              <span className="text-[var(--text-muted)]">40-59: Fair</span>
              <span className="text-amber-500 font-semibold font-mono">Small loans available</span>
            </div>
            <div className="flex justify-between items-center text-[13px] border-b border-gray-100 dark:border-[#2d3d2d] pb-2">
              <span className="text-[var(--text-muted)]">60-79: Good</span>
              <span className="text-blue-500 font-semibold font-mono">Standard loans</span>
            </div>
            <div className="flex justify-between items-center text-[13px] pb-1">
              <span className="text-[var(--text-muted)]">80-100: Excellent</span>
              <span className="text-green-500 font-semibold font-mono">Max loans & visibility</span>
            </div>
          </div>
        </div>

        <div className="card-bg border border-[var(--border)] p-4 md:p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
          <h3 className="text-[16px] font-bold text-[var(--text-main)] mb-4 font-geist flex items-center gap-2">
            <span className="material-symbols-outlined text-[#22C55E]">bolt</span>
            How to improve your score
          </h3>
          <ul className="text-[13px] text-[var(--text-muted)] space-y-3">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-green-500 text-[18px] shrink-0">check_circle</span>
              <span>Pay your contribution on time every month — <strong>worth 40%</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-green-500 text-[18px] shrink-0">check_circle</span>
              <span>Repay loans in full and on time — <strong>worth 30%</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-green-500 text-[18px] shrink-0">check_circle</span>
              <span>Stay in the group longer — <strong>worth 20%</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-green-500 text-[18px] shrink-0">check_circle</span>
              <span>Maintain an unbroken contribution streak — <strong>worth 10%</strong></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
