'use client'
import { useState } from 'react'

type Channel = 'sms' | 'whatsapp'

export function InviteModal({ 
  onClose,
  chamaId,
  chamaName,
  adminId
}: {
  onClose: () => void
  chamaId: string
  chamaName: string
  adminId: string
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<Channel>('sms')
  const [step, setStep] = useState<'form' | 'sending' | 'sent'>('form')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  function validatePhone(p: string) {
    const digits = p.replace(/\D/g, '')
    return digits.length >= 9
  }

  async function handleSend() {
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    setStep('sending')
    setError('')

    try {
      const res = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          name: name.trim() || null,
          chama_id: chamaId,
          invited_by: adminId,
          channel
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not send invite. Please try again.')
        setStep('form')
        return
      }

      setResult(data)
      setStep('sent')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setStep('form')
    }
  }

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)'
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)'
  }

  const channelConfig = {
    sms: { icon: 'sms', label: 'SMS', color: '#22C55E', desc: 'Send a text message' },
    whatsapp: { icon: 'chat', label: 'WhatsApp', color: '#25D366', desc: 'Send via WhatsApp' }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl p-6" style={cardStyle}>

        {/* FORM */}
        {step === 'form' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold">Invite a Member</h2>
              <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Channel selector */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(['sms', 'whatsapp'] as Channel[]).map(ch => {
                const cfg = channelConfig[ch]
                const active = channel === ch
                return (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: active ? cfg.color : 'var(--border)',
                      backgroundColor: active ? `${cfg.color}10` : 'var(--bg-subtle)'
                    }}>
                    <span
                      className="material-symbols-outlined text-[24px]"
                      style={{ color: active ? cfg.color : 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}>
                      {cfg.icon}
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: active ? cfg.color : 'var(--text-secondary)' }}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{cfg.desc}</span>
                  </button>
                )
              })}
            </div>

            {/* Info banner */}
            <div className="rounded-xl p-3 mb-5 flex gap-2"
              style={{ backgroundColor: 'var(--bg-subtle)', borderLeft: `3px solid ${channelConfig[channel].color}` }}>
              <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5"
                style={{ color: channelConfig[channel].color, fontVariationSettings: "'FILL' 1" }}>
                {channel === 'whatsapp' ? 'chat' : 'sms'}
              </span>
              <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {channel === 'whatsapp'
                  ? `A WhatsApp message with the invite code will be sent to join ${chamaName}.`
                  : `An SMS with the invite code will be sent via Twilio to join ${chamaName}.`}
              </p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Member Name <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Grace Wanjiku"
                className="w-full px-4 py-3 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E]"
                style={inputStyle} />
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}>
                Phone Number
              </label>
              <div className="flex">
                <div className="flex items-center px-3 rounded-l-xl border border-r-0 text-[14px] font-medium"
                  style={{ backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  +254
                </div>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 px-4 py-3 rounded-r-xl border text-[15px] focus:outline-none"
                  style={{ ...inputStyle, outlineColor: channelConfig[channel].color }}
                  onFocus={e => e.target.style.borderColor = channelConfig[channel].color}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 border rounded-xl text-[14px] font-semibold transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                Cancel
              </button>
              <button onClick={handleSend} disabled={!phone.trim()}
                className="flex-1 py-3 text-white rounded-xl text-[14px] font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: channelConfig[channel].color }}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {channel === 'whatsapp' ? 'chat' : 'sms'}
                </span>
                Send via {channelConfig[channel].label}
              </button>
            </div>
          </>
        )}

        {/* SENDING */}
        {step === 'sending' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <span className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${channelConfig[channel].color}40`, borderTopColor: 'transparent' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              Sending {channel === 'whatsapp' ? 'WhatsApp message' : 'SMS'} via Twilio...
            </p>
          </div>
        )}

        {/* SENT */}
        {step === 'sent' && (
          <div className="flex flex-col items-center text-center gap-5 py-2">
            {(() => {
              const currentChan = (result?.channel || channel) === 'whatsapp' ? 'whatsapp' : 'sms';
              const cfg = channelConfig[currentChan];
              return (
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cfg.color}15` }}>
                  <span className="material-symbols-outlined text-[32px]"
                    style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}>
                    {result?.sms_sent ? (currentChan === 'whatsapp' ? 'chat' : 'sms') : 'key'}
                  </span>
                </div>
              );
            })()}

            <div>
              <h3 className="text-[18px] font-bold mb-1">
                {result?.sms_sent
                  ? `${result?.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Sent!`
                  : 'Invite Created'}
              </h3>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {result?.sms_sent
                  ? `Message delivered to ${result?.phone || phone}.`
                  : result?.note || 'Share this code manually.'}
              </p>
            </div>

            {/* Code */}
            <div className="w-full rounded-xl p-4 flex flex-col items-center gap-2"
              style={{ backgroundColor: 'var(--bg-subtle)', border: '1px dashed var(--border)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Invite Code
              </span>
              <span className="text-[28px] font-mono font-bold tracking-widest" style={{ color: channelConfig[channel].color }}>
                {result?.code}
              </span>
              <button onClick={() => navigator.clipboard.writeText(result?.code || '')}
                className="text-[12px] flex items-center gap-1 transition-colors hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy code
              </button>
            </div>

            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Code expires in 48 hours · Single use
            </p>

            <button onClick={onClose}
              className="w-full py-3 text-white rounded-xl text-[14px] font-semibold transition-colors"
              style={{ backgroundColor: channelConfig[channel].color }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
