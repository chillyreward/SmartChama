'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

type NameStatus = 'idle' | 'checking' | 'available' | 'taken';

function generateSuggestions(name: string): string[] {
  const base = name.trim();
  const year = new Date().getFullYear();
  const suggestions: string[] = [];
  for (const s of ['Plus', 'United', 'Circle', 'Welfare', String(year)]) {
    if (!base.toLowerCase().endsWith(s.toLowerCase())) suggestions.push(`${base} ${s}`);
    if (suggestions.length >= 3) break;
  }
  for (const p of ['New', 'Smart', 'Pro']) {
    if (!base.toLowerCase().startsWith(p.toLowerCase())) suggestions.push(`${p} ${base}`);
    if (suggestions.length >= 5) break;
  }
  return suggestions.slice(0, 4);
}

interface Props {
  onSuccess: (chamaId: string) => void;
  onClose?: () => void;
  /** If true, the modal cannot be dismissed (new account with no chama) */
  required?: boolean;
}

export default function CreateChamaModal({ onSuccess, onClose, required = false }: Props) {
  const { session } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    contribution_amount: '',
    contribution_frequency: 'monthly',
    payment_type: 'till',
    till_number: '',
    paybill_number: '',
    account_number: '',
    phone_number: '',
    account_name: '',
  });

  const [nameStatus, setNameStatus] = useState<NameStatus>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced name check
  useEffect(() => {
    const trimmed = form.name.trim();
    if (trimmed.length < 3) { setNameStatus('idle'); setSuggestions([]); return; }
    setNameStatus('checking');
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const [{ data: v2 }, { data: legacy }] = await Promise.all([
        supabase.from('chamas_v2').select('id').ilike('name', trimmed).limit(1),
        supabase.from('chamas').select('id').ilike('name', trimmed).limit(1),
      ]);
      if ((v2 && v2.length > 0) || (legacy && legacy.length > 0)) {
        setNameStatus('taken'); setSuggestions(generateSuggestions(trimmed));
      } else {
        setNameStatus('available'); setSuggestions([]);
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    if (nameStatus === 'taken') { setError('That chama name is already taken.'); return; }
    if (nameStatus === 'checking') { setError('Please wait while we check name availability.'); return; }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/chamas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email,
          phone: '',
          chama_name: form.name.trim(),
          contribution_amount: form.contribution_amount,
          contribution_frequency: form.contribution_frequency,
          payment_type: form.payment_type,
          till_number: form.till_number,
          paybill_number: form.paybill_number,
          account_number: form.account_number,
          phone_number: form.phone_number,
          account_name: form.account_name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create chama. Please try again.');
        setSaving(false);
        return;
      }

      const chamaId = data.chama_id || data.chamaId;
      if (chamaId) {
        document.cookie = `active_chama_id=${chamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
        sessionStorage.setItem('active_chama_id', chamaId);
      }

      onSuccess(chamaId);
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-main)] bg-[var(--bg-input)] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] text-[14px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={required ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[20px] font-bold text-[var(--text-main)]">Create a Chama</h2>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Set up your group to start adding members</p>
          </div>
          {!required && onClose && (
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--border)] transition-colors">
              <span className="material-symbols-outlined text-[20px] text-[var(--text-muted)]">close</span>
            </button>
          )}
        </div>

        {/* Form */}
        <form id="create-chama-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-[13px] text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Chama Name */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Chama Name</label>
            <div className="relative">
              <input
                type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Vision 2030 Savings"
                className={inputClass + ' pr-10'}
                style={{
                  borderColor:
                    nameStatus === 'available' ? '#22C55E' :
                    nameStatus === 'taken' ? '#EF4444' :
                    nameStatus === 'checking' ? '#F97316' : undefined
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameStatus === 'checking' && <div className="w-4 h-4 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />}
                {nameStatus === 'available' && <span className="material-symbols-outlined text-[18px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                {nameStatus === 'taken' && <span className="material-symbols-outlined text-[18px] text-[#EF4444]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>}
              </div>
            </div>
            {nameStatus === 'available' && (
              <p className="text-[12px] mt-1 text-[#22C55E]">"{form.name}" is available!</p>
            )}
            {nameStatus === 'taken' && (
              <>
                <p className="text-[12px] mt-1 text-[#EF4444]">That name is taken. Try:</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm({ ...form, name: s })}
                      className="px-2.5 py-1 rounded-lg text-[12px] border border-[var(--border)] hover:border-[#22C55E] hover:text-[#22C55E] transition-colors text-[var(--text-muted)]">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Contribution + Frequency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Contribution (KSh)</label>
              <input type="number" required min="100" value={form.contribution_amount}
                onChange={e => setForm({ ...form, contribution_amount: e.target.value })}
                placeholder="e.g. 5000" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Frequency</label>
              <select value={form.contribution_frequency}
                onChange={e => setForm({ ...form, contribution_frequency: e.target.value })}
                className={inputClass}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Payment setup */}
          <div className="border-t border-[var(--border)] pt-4">
            <label className="block text-[13px] font-semibold text-[var(--text-main)] mb-3">Where will members send money?</label>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { value: 'till', label: 'Till Number (Lipa na M-Pesa)' },
                { value: 'paybill', label: 'Paybill Number' },
                { value: 'phone', label: 'Phone Number (Send Money)' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-[14px] text-[var(--text-main)]">
                  <input type="radio" name="payment_type" value={opt.value}
                    checked={form.payment_type === opt.value}
                    onChange={e => setForm({ ...form, payment_type: e.target.value })}
                    className="accent-[#22C55E]" />
                  {opt.label}
                </label>
              ))}
            </div>

            {form.payment_type === 'till' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Till Number</label>
                  <input type="text" required value={form.till_number} onChange={e => setForm({ ...form, till_number: e.target.value })} placeholder="e.g. 543210" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Account Name</label>
                  <input type="text" required value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. VISION 2030 CHAMA" className={inputClass} />
                </div>
              </div>
            )}

            {form.payment_type === 'paybill' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Paybill Number</label>
                  <input type="text" required value={form.paybill_number} onChange={e => setForm({ ...form, paybill_number: e.target.value })} placeholder="e.g. 247247" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Account Number</label>
                  <input type="text" required value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} placeholder="e.g. CHAMA2030" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Account Name</label>
                  <input type="text" required value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. VISION 2030 CHAMA" className={inputClass} />
                </div>
              </div>
            )}

            {form.payment_type === 'phone' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Phone Number</label>
                  <input type="tel" required value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} placeholder="+254712345678" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Account Name</label>
                  <input type="text" required value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. Grace Wanjiku" className={inputClass} />
                </div>
              </div>
            )}
          </div>

          <button type="submit" form="create-chama-form"
            disabled={saving || nameStatus === 'taken' || nameStatus === 'checking'}
            className="w-full bg-[#22C55E] text-white py-3.5 rounded-xl text-[15px] font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">add</span>Create Chama</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
