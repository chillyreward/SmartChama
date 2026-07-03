'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'

interface FraudFlag {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  recommendation?: string
  source: 'rule' | 'ai'
  details?: string
}

interface ScanResult {
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  flags: FraudFlag[]
  overall_assessment: string
  immediate_actions: string[]
  scanned_at: string
}

const severityConfig = {
  high: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/30', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: 'dangerous' },
  medium: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900/30', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400', icon: 'warning' },
  low: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-200 dark:border-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-500', badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500', icon: 'info' },
}

const riskLevelConfig = {
  Low: { color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-950/20', icon: 'shield' },
  Medium: { color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20', icon: 'security' },
  High: { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20', icon: 'gpp_bad' },
  Critical: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/30', icon: 'emergency' },
}

const flagTypeLabels: Record<string, string> = {
  duplicate_transaction: 'Duplicate Transaction',
  fake_contribution: 'Fake Contribution',
  suspicious_reversal: 'Suspicious Reversal',
  abnormal_withdrawal: 'Abnormal Withdrawal',
  loan_stacking: 'Loan Stacking',
  ghost_member: 'Ghost Member',
  admin_self_dealing: 'Admin Self-Dealing',
  unusual_pattern: 'Unusual Pattern',
  suspicious_amount: 'Suspicious Amount',
  fake_chama: 'Suspicious Group',
  suspicious_pattern: 'Suspicious Pattern',
}

export default function FraudDetectionPage() {
  const { group } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  const runScan = async () => {
    if (!group) return
    setScanning(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/fraud/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chama_id: group.id })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Scan failed'); return }
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  const riskConfig = result ? riskLevelConfig[result.risk_level] : null
  const highFlags = result?.flags.filter(f => f.severity === 'high') || []
  const medFlags = result?.flags.filter(f => f.severity === 'medium') || []
  const lowFlags = result?.flags.filter(f => f.severity === 'low') || []

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)]">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] mb-1 flex items-center gap-1">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>AI Fraud Detection</span>
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">AI Fraud Detection</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            Powered by SmartChama AI · Detects fraud before damage occurs
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning || !group}
          className="flex items-center gap-2 bg-[#22C55E] text-white px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50"
        >
          {scanning ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Scanning...</>
          ) : (
            <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>Run AI Fraud Scan</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-700 dark:text-red-400 text-[14px]">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!result && !scanning && (
        <div className="card-bg border border-[var(--border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
          </div>
          <h2 className="text-[18px] font-bold mb-2">No scan run yet</h2>
          <p className="text-[14px] text-[var(--text-muted)] max-w-md mx-auto mb-6">
            The AI will analyse your group's transactions, contributions, loans, and member behaviour for fraud patterns — including duplicates, fake contributions, suspicious reversals, and abnormal withdrawals.
          </p>
          <button onClick={runScan} disabled={!group}
            className="bg-[#22C55E] text-white px-6 py-3 rounded-xl text-[14px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50">
            Run First Scan
          </button>
        </div>
      )}

      {/* Scanning state */}
      {scanning && (
        <div className="card-bg border border-[var(--border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="material-symbols-outlined text-[32px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <h2 className="text-[18px] font-bold mb-2">AI is scanning your group...</h2>
          <p className="text-[14px] text-[var(--text-muted)]">Checking transactions, contributions, loans, and member patterns</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">

          {/* Risk level summary */}
          <div className={`rounded-2xl p-6 border ${riskConfig?.bg} flex flex-col md:flex-row md:items-center gap-4`}
            style={{ border: `1px solid var(--border)` }}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${riskConfig?.bg}`}>
              <span className={`material-symbols-outlined text-[28px] ${riskConfig?.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {riskConfig?.icon}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-[20px] font-bold">Risk Level: <span className={riskConfig?.color}>{result.risk_level}</span></h2>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Scanned {new Date(result.scanned_at).toLocaleString('en-KE')}
                </span>
              </div>
              <p className="text-[14px] text-[var(--text-muted)]">{result.overall_assessment}</p>
            </div>
            <div className="flex gap-3 text-center flex-shrink-0">
              <div className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/20">
                <div className="text-[20px] font-bold text-red-500">{highFlags.length}</div>
                <div className="text-[11px] text-red-500 font-semibold">HIGH</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/20">
                <div className="text-[20px] font-bold text-orange-500">{medFlags.length}</div>
                <div className="text-[11px] text-orange-500 font-semibold">MEDIUM</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/20">
                <div className="text-[20px] font-bold text-yellow-600">{lowFlags.length}</div>
                <div className="text-[11px] text-yellow-600 font-semibold">LOW</div>
              </div>
            </div>
          </div>

          {/* Immediate actions */}
          {result.immediate_actions.length > 0 && (
            <div className="rounded-2xl p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
              <h3 className="text-[15px] font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                Immediate Actions Required
              </h3>
              <ul className="space-y-2">
                {result.immediate_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-red-700 dark:text-red-400">
                    <span className="font-bold flex-shrink-0">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No flags */}
          {result.flags.length === 0 && (
            <div className="card-bg border border-[var(--border)] rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#22C55E] block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <h3 className="text-[16px] font-bold mb-1">No fraud patterns detected</h3>
              <p className="text-[14px] text-[var(--text-muted)]">Your group's activity looks clean. Run scans regularly to stay protected.</p>
            </div>
          )}

          {/* Flags list */}
          {result.flags.length > 0 && (
            <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-[16px] font-bold">Detected Fraud Flags ({result.flags.length})</h3>
                <span className="text-[12px] text-[var(--text-muted)] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  AI + Rule-based detection
                </span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {result.flags.map((flag, i) => {
                  const cfg = severityConfig[flag.severity] || severityConfig.low
                  return (
                    <div key={i} className={`p-5 ${cfg.bg}`}>
                      <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-[22px] ${cfg.text} flex-shrink-0 mt-0.5`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {cfg.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                              {flag.severity.toUpperCase()}
                            </span>
                            <span className="text-[13px] font-bold text-[var(--text-main)]">
                              {flagTypeLabels[flag.type] || flag.type}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${flag.source === 'ai' ? 'border-purple-200 text-purple-600 bg-purple-50 dark:bg-purple-950/20' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                              {flag.source === 'ai' ? '✦ AI detected' : 'Rule detected'}
                            </span>
                          </div>
                          <p className={`text-[14px] ${cfg.text}`}>{flag.description}</p>
                          {flag.details && (
                            <p className="text-[12px] text-[var(--text-muted)] mt-1">{flag.details}</p>
                          )}
                          {flag.recommendation && (
                            <div className="mt-2 flex items-start gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-[#22C55E] flex-shrink-0 mt-0.5">lightbulb</span>
                              <p className="text-[12px] text-[var(--text-muted)]">{flag.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rescan button */}
          <div className="flex justify-center">
            <button onClick={runScan} disabled={scanning}
              className="flex items-center gap-2 border border-[var(--border)] px-5 py-2.5 rounded-xl text-[14px] font-medium hover:bg-[var(--bg-subtle)] transition-colors">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Run Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
