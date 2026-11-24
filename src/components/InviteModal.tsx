'use client';

import { useState } from 'react';
import { Check, Copy, MessageCircle, MessageSquareText } from 'lucide-react';
import { Button, Field, Modal, Notice, cn, inputClass } from '@/components/ui';

type Channel = 'sms' | 'whatsapp';
type Result = { code?: string; sms_sent?: boolean; email_sent?: boolean; whatsapp_url?: string; note?: string; phone?: string };

export function InviteModal({ onClose, chamaId, chamaName, adminId }: { onClose: () => void; chamaId: string; chamaName: string; adminId: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<Channel>('sms');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSend = digits.length >= 9 || emailOk;

  async function send() {
    if (!canSend) { setError('Add a phone number or an email address.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: digits.length >= 9 ? phone.trim() : null,
          email: emailOk ? email.trim() : null,
          name: name.trim() || null,
          chama_id: chamaId,
          invited_by: adminId,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'The invite was not sent. Try again.'); return; }
      setResult(data);
      if (data.whatsapp_url) window.open(data.whatsapp_url, '_blank', 'noopener');
    } catch {
      setError('No connection. Check your internet and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result?.code) return;
    try { await navigator.clipboard.writeText(result.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  if (result) {
    return (
      <Modal open onClose={onClose} title="Invite ready" footer={<Button onClick={onClose}>Done</Button>}>
        <p className="text-[15px] text-ink-2">
          {result.sms_sent
            ? `We texted the code to ${result.phone || phone}.`
            : result.note || `Share this code so they can join ${chamaName}.`}
        </p>
        <div className="mt-4 rounded-[18px] bg-tint p-5 text-center">
          <div className="text-[13px] text-ink-3">Invite code</div>
          <div className="font-money text-[30px] tracking-[0.12em] mt-1 break-all">{result.code}</div>
          <button type="button" onClick={copy} className="mt-2 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] font-medium hover:bg-raised">
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        {result.whatsapp_url && (
          <a href={result.whatsapp_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 h-12 rounded-full bg-[#25D366] text-[#08311A] text-[15px] font-semibold">
            <MessageCircle size={18} aria-hidden="true" />Open WhatsApp
          </a>
        )}
        <p className="text-[13px] text-ink-3 mt-3">The code works once and expires in 48 hours.</p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Invite to ${chamaName || 'your group'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={send} disabled={busy || !canSend}>{busy ? 'Sending…' : 'Send invite'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Send by">
        {([
          { v: 'sms', label: 'SMS', icon: MessageSquareText },
          { v: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
        ] as const).map((c) => (
          <button
            key={c.v}
            type="button"
            role="radio"
            aria-checked={channel === c.v}
            onClick={() => setChannel(c.v)}
            className={cn(
              'h-12 rounded-[14px] border inline-flex items-center justify-center gap-2 text-[15px] font-medium',
              channel === c.v ? 'border-brand bg-tint text-brand' : 'border-line bg-surface-2 text-ink-2 hover:bg-raised',
            )}
          >
            <c.icon size={18} aria-hidden="true" />{c.label}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-ink-3 mt-2">
        {channel === 'whatsapp' ? 'WhatsApp opens on your phone with the invite ready to send.' : 'We text the invite code to their phone.'}
      </p>

      <div className="flex flex-col gap-4 mt-5">
        <Field label="Their name" hint="Optional">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grace Wanjiku" className={inputClass} autoComplete="off" />
        </Field>
        <Field label="Phone number">
          <div className="flex items-stretch min-w-0">
            <span className="h-12 px-3.5 inline-flex items-center rounded-l-[14px] border border-r-0 border-line bg-raised text-[15px] text-ink-2 shrink-0">+254</span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="712 345 678"
              className={cn(inputClass, 'rounded-l-none min-w-0 flex-1')}
            />
          </div>
        </Field>
        <Field label="Email" hint="Optional. We also send the code here.">
          <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="grace@example.com" className={inputClass} autoComplete="off" />
        </Field>
      </div>

      {error && <Notice tone="danger" className="mt-4">{error}</Notice>}
    </Modal>
  );
}
