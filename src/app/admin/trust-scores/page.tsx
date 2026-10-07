"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface MemberScore {
  id: string;
  profile_id: string;
  full_name: string;
  role: string;
  trust_score: number;
  ai_rating?: string;
  ai_explanation?: string;
  ai_risk_flags?: string[];
  ai_positive_factors?: string[];
  ai_negative_factors?: string[];
  ai_recommendation?: string;
  calculating?: boolean;
}

export default function AdminTrustScoresPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberScore[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [calculatingAll, setCalculatingAll] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideMember, setOverrideMember] = useState<MemberScore | null>(null);
  const [newScore, setNewScore] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const fetchMembers = async () => {
    if (!group) return;
    setLoading(true);
    const { data } = await supabase
      .from('chama_memberships')
      .select('id, profile_id, role, trust_score, profiles(full_name)')
      .eq('chama_id', group.id)
      .eq('status', 'active')
      .order('trust_score', { ascending: false });

    setMembers((data || []).map((m: any) => ({
      id: m.id,
      profile_id: m.profile_id,
      full_name: m.profiles?.full_name || 'Unknown',
      role: m.role,
      trust_score: m.trust_score ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [group]);

  // Calculate AI score for a single member
  const calculateScore = async (membershipId: string) => {
    if (!group) return;
    setMembers(prev => prev.map(m =>
      m.id === membershipId ? { ...m, calculating: true } : m
    ));

    try {
      const res = await fetch('/api/trust-score/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: membershipId, chama_id: group.id })
      });
      const data = await res.json();

      if (res.ok) {
        setMembers(prev => prev.map(m =>
          m.id === membershipId ? {
            ...m,
            trust_score: data.score,
            ai_rating: data.rating,
            ai_explanation: data.explanation,
            ai_risk_flags: data.risk_flags,
            ai_positive_factors: data.positive_factors,
            ai_negative_factors: data.negative_factors,
            ai_recommendation: data.recommendation,
            calculating: false
          } : m
        ).sort((a, b) => b.trust_score - a.trust_score))
        showToast(`Credit score updated`)
      } else {
        setMembers(prev => prev.map(m =>
          m.id === membershipId ? { ...m, calculating: false } : m
        ));
        showToast('Failed to calculate score');
      }
    } catch {
      setMembers(prev => prev.map(m =>
        m.id === membershipId ? { ...m, calculating: false } : m
      ));
    }
  };

  // Calculate AI scores for all members sequentially
  const calculateAllScores = async () => {
    if (!group || calculatingAll) return;
    setCalculatingAll(true);
    showToast('Calculating AI scores for all members...');

    for (const m of members) {
      await calculateScore(m.id);
      await new Promise(r => setTimeout(r, 500)); // avoid rate limiting
    }

    setCalculatingAll(false);
    showToast('All scores recalculated with AI ✓');
  };

  // Manual override
  const handleOverride = async () => {
    if (!overrideMember || !newScore || !group) return;
    const score = Math.min(100, Math.max(0, parseInt(newScore)));

    await supabase
      .from('chama_memberships')
      .update({ trust_score: score })
      .eq('id', overrideMember.id);

    await supabase.from('audit_log').insert({
      chama_id: group.id,
      actor_id: adminMember?.profile_id,
      action: 'trust_score_override',
      target_type: 'membership',
      target_id: overrideMember.id,
      details: { new_score: score, reason: overrideReason, previous_score: overrideMember.trust_score }
    });

    setMembers(prev => prev.map(m =>
      m.id === overrideMember.id ? { ...m, trust_score: score } : m
    ).sort((a, b) => b.trust_score - a.trust_score));

    showToast(`Score updated for ${overrideMember.full_name}`);
    setShowOverrideModal(false);
    setNewScore("");
    setOverrideReason("");
  };

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'Excellent': return 'text-[#22C55E]';
      case 'Good': return 'text-blue-500';
      case 'Fair': return 'text-yellow-500';
      case 'Poor': return 'text-orange-500';
      case 'Very Poor': return 'text-red-500';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const getScoreColor = (score: number) =>
    score >= 80 ? 'text-[#22C55E]' : score >= 60 ? 'text-blue-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';

  const getScoreBg = (score: number) =>
    score >= 80 ? 'bg-green-50 dark:bg-green-950/20' : score >= 60 ? 'bg-blue-50 dark:bg-blue-950/20' : score >= 40 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-red-50 dark:bg-red-950/20';

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full">
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter text-[var(--text-main)]">

      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#161d16] text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#22C55E] text-[18px]">auto_awesome</span>
          <span className="text-[14px] font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] mb-1 flex items-center gap-1">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Credit Scores</span>
          </p>
          <h1 className="text-[26px] font-bold tracking-tight">AI Credit Scores</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#22C55E]">smart_toy</span>
            Powered by SmartChama AI · GPT-4o
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={calculateAllScores}
            disabled={calculatingAll}
            className="flex items-center gap-2 bg-[#22C55E] text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50"
          >
            {calculatingAll ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            )}
            {calculatingAll ? 'Calculating...' : 'Recalculate All with AI'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Members', value: members.length, icon: 'group' },
          { label: 'Avg Score', value: members.length > 0 ? Math.round(members.reduce((a, m) => a + (Number(m.trust_score) || 0), 0) / members.length) : 0, icon: 'analytics' },
          { label: 'Excellent (80+)', value: members.filter(m => m.trust_score >= 80).length, icon: 'verified', color: 'text-[#22C55E]' },
          { label: 'At Risk (<40)', value: members.filter(m => m.trust_score < 40).length, icon: 'warning', color: 'text-red-500' },
        ].map(stat => (
          <div key={stat.label} className="card-bg border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-[18px] ${stat.color || 'text-[var(--text-muted)]'}`}>{stat.icon}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</span>
            </div>
            <div className="text-[28px] font-bold">{String(stat.value ?? 0)}</div>
          </div>
        ))}
      </div>

      {/* Member list */}
      <div className="card-bg border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[16px] font-bold">Member Scores</h2>
          <span className="text-[12px] text-[var(--text-muted)]">Click a member to see AI analysis</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {members.length === 0 ? (
            <div className="p-10 text-center text-[var(--text-muted)]">No members found.</div>
          ) : (
            members.map((m, idx) => (
              <div key={m.id}>
                <div
                  className="flex items-center gap-4 p-4 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-[12px] font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 dark:bg-gray-800 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 dark:bg-orange-950/20 text-orange-700' :
                    'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}>{idx + 1}</div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{m.full_name}</div>
                    <div className="text-[12px] text-[var(--text-muted)] capitalize">{m.role}</div>
                  </div>

                  {/* AI Rating badge */}
                  {m.ai_rating && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getScoreBg(m.trust_score)} ${getRatingColor(m.ai_rating)}`}>
                      {m.ai_rating}
                    </span>
                  )}

                  {/* Score */}
                  <div className={`text-[22px] font-bold w-14 text-right ${getScoreColor(m.trust_score)}`}>
                    {m.calculating ? (
                      <div className="w-5 h-5 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin ml-auto" />
                    ) : m.trust_score}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); calculateScore(m.id); }}
                      disabled={m.calculating || calculatingAll}
                      className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors disabled:opacity-40"
                      title="Recalculate with AI"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#22C55E]">smart_toy</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setOverrideMember(m); setShowOverrideModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors"
                      title="Manual override"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[var(--text-muted)]">edit</span>
                    </button>
                    <span className={`material-symbols-outlined text-[18px] text-[var(--text-muted)] transition-transform ${expandedId === m.id ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded AI analysis */}
                {expandedId === m.id && (
                  <div className="px-4 pb-4 ml-12">
                    {m.ai_explanation ? (
                      <div className="rounded-xl p-4 text-[13px] space-y-3"
                        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>

                        {/* AI header */}
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                          <span className="font-semibold text-[13px]">AI Credit Profile</span>
                        </div>

                        {/* Explanation */}
                        <p className="text-[var(--text-muted)] leading-relaxed">{m.ai_explanation}</p>

                        {/* Risk flags */}
                        {m.ai_risk_flags && m.ai_risk_flags.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              Risk Flags Detected
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.ai_risk_flags.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-[12px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Positive factors */}
                        {m.ai_positive_factors && m.ai_positive_factors.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#22C55E] mb-1.5">Strengths</p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.ai_positive_factors.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-[12px] bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Negative factors */}
                        {m.ai_negative_factors && m.ai_negative_factors.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-500 mb-1.5">Areas of Concern</p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.ai_negative_factors.map((f, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-[12px] bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30">
                                  ⚠ {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        {m.ai_recommendation && (
                          <div className="rounded-lg px-3 py-2 flex gap-2 items-start"
                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <span className="material-symbols-outlined text-[16px] text-[#22C55E] flex-shrink-0 mt-0.5">lightbulb</span>
                            <p className="text-[12px] text-[var(--text-muted)]">{m.ai_recommendation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl p-4 text-[13px] text-[var(--text-muted)] flex items-center gap-2"
                        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        Click the AI icon to generate an explainable credit profile for this member.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && overrideMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-bg border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-[18px] font-bold mb-1">Override Credit Score</h2>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">
              {overrideMember.full_name} · Current score: <strong>{overrideMember.trust_score}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">New Score (0–100)</label>
                <input type="number" min="0" max="100" value={newScore}
                  onChange={e => setNewScore(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[#22C55E]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Reason (logged in audit)</label>
                <textarea rows={3} value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Required for audit trail..."
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 bg-[var(--bg-input)] text-[var(--text-main)] focus:outline-none focus:border-[#22C55E] resize-none text-[14px]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowOverrideModal(false)}
                className="flex-1 border border-[var(--border)] rounded-lg py-2.5 text-[14px] font-medium hover:bg-[var(--bg-subtle)]">
                Cancel
              </button>
              <button onClick={handleOverride}
                disabled={!newScore || !overrideReason}
                className="flex-1 bg-[#22C55E] text-white rounded-lg py-2.5 text-[14px] font-semibold hover:bg-[#16A34A] disabled:opacity-50">
                Update Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
