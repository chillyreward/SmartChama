'use client'
import { useState } from 'react'

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
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState<'form' | 'sending' | 'sent'>('form')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setStep('sending')
    setError('')

    try {
      const response = await fetch(
        '/api/invites/send',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim() || null,
            chama_id: chamaId,
            invited_by: adminId
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Could not send invite. Please try again.')
        setStep('form')
        return
      }

      setResult(data)
      setStep('sent')
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred. Please try again.')
      setStep('form')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--bg-card, #FFFFFF)',
          color: 'var(--text-primary, #0A0A0A)',
          border: '1px solid var(--border, #E5E7EB)'
        }}>

        {/* FORM STEP */}
        {step === 'form' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold">
                Invite a Member
              </h2>
              <button
                onClick={onClose}
                style={{ color: 'var(--text-muted, #A3A3A3)' }}>
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            {/* How it works info */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                backgroundColor: 'var(--bg-subtle, #F0FAF0)',
                borderLeft: '3px solid #22C55E'
              }}>
              <p
                className="text-[13px]"
                style={{ color: 'var(--text-secondary, #525252)' }}>
                The member will receive an email with a button to join {chamaName}. Only invited people can join your chama.
              </p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary, #525252)' }}>
                Member Name
                <span className="ml-1 normal-case font-normal" style={{ color: 'var(--text-muted, #A3A3A3)' }}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Grace Wanjiku"
                className="w-full px-4 py-3 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E]"
                style={{
                  backgroundColor: 'var(--bg-input, #FFFFFF)',
                  borderColor: 'var(--border, #E5E7EB)',
                  color: 'var(--text-primary, #0A0A0A)'
                }}
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label
                className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary, #525252)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="grace@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border text-[15px] focus:outline-none focus:border-[#22C55E]"
                style={{
                  backgroundColor: 'var(--bg-input, #FFFFFF)',
                  borderColor: 'var(--border, #E5E7EB)',
                  color: 'var(--text-primary, #0A0A0A)'
                }}
              />
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border rounded-xl text-[14px] font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                style={{ 
                  borderColor: 'var(--border, #E5E7EB)', 
                  color: 'var(--text-primary, #0A0A0A)' 
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-3 bg-[#22C55E] text-white rounded-xl text-[14px] font-semibold hover:bg-[#16A34A] transition-colors"
              >
                Send Invite
              </button>
            </div>
          </>
        )}

        {/* SENDING STEP */}
        {step === 'sending' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <span className="w-8 h-8 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></span>
            <p className="text-[14px]" style={{ color: 'var(--text-secondary, #525252)' }}>
              Generating invite code and sending email...
            </p>
          </div>
        )}

        {/* SENT STEP */}
        {step === 'sent' && (
          <div className="flex flex-col items-center text-center gap-6 py-4">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#22C55E] text-[32px]">
                check_circle
              </span>
            </div>
            
            <div>
              <h3 className="text-[18px] font-bold mb-2">Invite Created!</h3>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary, #525252)' }}>
                {result?.email_sent 
                  ? `An invitation email has been sent to ${email}.`
                  : `Invite saved, but email delivery failed. Please share the code manually.`}
              </p>
            </div>

            <div className="w-full bg-gray-50 dark:bg-zinc-900 border border-dashed rounded-xl p-4 flex flex-col items-center gap-2" 
              style={{ borderColor: 'var(--border, #E5E7EB)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3]">
                Invite Code
              </span>
              <span className="text-2xl font-mono font-bold tracking-widest text-[#22C55E]">
                {result?.code}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#22C55E] text-white rounded-xl text-[14px] font-semibold hover:bg-[#16A34A] transition-colors"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
