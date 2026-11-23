'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- untyped Supabase rows */
import { Check, Info, Smartphone, X } from 'lucide-react'
import { RingMark, cn, formatKsh } from '@/components/ui'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function NewContributionModal({ 
  onClose, 
  defaultAmount,
  memberPhone,
  membershipId,
  chamaId,
  chamaName
}: {
  onClose: () => void
  defaultAmount: number
  memberPhone: string
  membershipId: string
  chamaId: string
  chamaName: string
}) {
  const [phone, setPhone] = useState(memberPhone || '')
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [step, setStep] = useState<'form' | 'sending' | 'waiting' | 'success' | 'failed'>('form')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [error, setError] = useState('')
  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Clean up polling interval when modal unmounts
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('chama_payment_config')
          .select('*')
          .eq('chama_id', chamaId)
          .maybeSingle()
        if (data) {
          setPaymentConfig(data)
        }
      } catch (err) {
        console.error('Error fetching chama payment config:', err)
      } finally {
        setLoadingConfig(false)
      }
    }
    if (chamaId) {
      fetchConfig()
    }
  }, [chamaId])

  async function handleSubmit() {
    setError('')
    
    // Validate phone
    let formattedPhone = phone.replace(/\s/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+254' + formattedPhone.slice(1)
    }
    if (!formattedPhone.startsWith('+254')) {
      formattedPhone = '+254' + formattedPhone
    }
    
    const phoneDigits = formattedPhone.replace('+', '')
    if (phoneDigits.length !== 12) {
      setError('Please enter a valid Kenyan phone number.')
      return
    }
    
    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      setError('Please enter a valid amount.')
      return
    }
    
    setStep('sending')
    
    try {
      // Cancel any previous in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: parsedAmount,
          membership_id: membershipId,
          chama_id: chamaId,
          account_ref: chamaName
        }),
        signal: abortRef.current.signal
      })
      
      const data = await response.json()
      
      if (!response.ok || data.error) {
        setError(data.error || 'Could not send payment request. Please try again.')
        setStep('form')
        return
      }
      
      // STK push sent successfully
      // Now waiting for Safaricom callback to confirm payment
      setStep('waiting')
      
      // Poll for confirmation every 3 seconds for up to 90 seconds
      let attempts = 0
      const maxAttempts = 30
      
      pollRef.current = setInterval(async () => {
        attempts++
        
        const { data: contribution } = await supabase
          .from('contributions_v2')
          .select('status, mpesa_receipt')
          .eq('mpesa_checkout_request_id', data.checkoutRequestId)
          .single()
        
        if (contribution?.status === 'confirmed') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setReceiptNumber(contribution.mpesa_receipt)
          setStep('success')
        }
        
        if (contribution?.status === 'failed') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setError('Payment was cancelled or failed. Please try again.')
          setStep('form')
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setStep('form')
          setError('Payment timed out. If you completed the payment, it will be recorded shortly. If not, please try again.')
        }
      }, 3000)
      
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError('Network error. Please check your connection and try again.')
      setStep('form')
    }
  }

  const parsed = parseFloat(amount) || 0;
  const dest = paymentConfig
    ? paymentConfig.payment_type === 'till'
      ? `Till ${paymentConfig.till_number}`
      : paymentConfig.payment_type === 'paybill'
        ? `Paybill ${paymentConfig.paybill_number}, account ${paymentConfig.account_number}`
        : `M-Pesa ${paymentConfig.phone_number}`
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="pay-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/55" onClick={onClose} />

      <div className="relative w-full sm:max-w-[460px] max-h-[94dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-forest text-[#EEF4EF] shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 id="pay-title" className="text-[15px] font-semibold">Pay into {chamaName || 'your group'}</h2>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-canopy">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {step === 'form' && (
          <form className="px-6 pb-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <label className="block text-center mt-6">
              <span className="sr-only">Amount in shillings</span>
              <span className="flex items-baseline justify-center gap-2">
                <span className="font-display text-[26px] text-[#8FAA9B]">KSh</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-[6.5ch] bg-transparent text-center font-money text-[58px] leading-none text-[#EEF4EF] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ width: `${Math.max(3, amount.length + 0.5)}ch` }}
                />
              </span>
            </label>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[defaultAmount, defaultAmount * 2, defaultAmount * 3].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  aria-pressed={parsed === v}
                  className={cn('h-9 px-4 rounded-full text-[13px] font-medium border', parsed === v ? 'bg-sage text-forest border-sage' : 'border-[#3D6B54] text-[#C9DACF] hover:bg-canopy')}
                >
                  {formatKsh(v)}
                </button>
              ))}
            </div>
            <p className="text-center text-[13px] text-[#8FAA9B] mt-3">The group contribution is {formatKsh(defaultAmount)}.</p>

            <label className="block mt-7">
              <span className="text-[14px] text-[#C9DACF]">M-Pesa number the prompt goes to</span>
              <span className="mt-2 flex h-[52px] rounded-[14px] bg-canopy border border-[#2F5A45] focus-within:border-mint overflow-hidden">
                <span className="px-4 flex items-center text-[15px] text-[#8FAA9B] border-r border-[#2F5A45]">+254</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phone.replace('+254', '').replace(/^254/, '')}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="712 345 678"
                  required
                  className="flex-1 bg-transparent px-4 text-[16px] text-[#EEF4EF] placeholder:text-[#6F8E7B] focus:outline-none"
                />
              </span>
            </label>

            <div className="mt-5 rounded-[16px] bg-canopy px-4 py-3.5 text-[13px] leading-relaxed text-[#C9DACF] flex gap-3">
              <Info size={18} className="shrink-0 mt-0.5 text-mint" aria-hidden="true" />
              <p>
                {dest
                  ? <>The money goes straight to the group&apos;s account ({paymentConfig.account_name || 'held by the officials'}) through {dest}. Akibora records it but never holds it.</>
                  : !loadingConfig
                    ? <>The money goes straight to the account your officials set up. Akibora records it but never holds it.</>
                    : <>Checking where the group collects payments…</>}
              </p>
            </div>

            {error && <div role="alert" className="mt-4 rounded-[14px] bg-danger-soft text-danger-ink px-4 py-3 text-[14px]">{error}</div>}

            <button type="submit" className="mt-6 w-full h-[56px] rounded-full bg-mint text-forest font-semibold text-[16px] hover:bg-[#9BEBBD] active:scale-[0.99]">
              Send M-Pesa prompt for {formatKsh(parsed)}
            </button>
            <p className="text-center text-[12px] text-[#8FAA9B] mt-3">You&apos;ll enter your M-Pesa PIN on your phone to finish.</p>
          </form>
        )}

        {step === 'sending' && (
          <div className="px-6 py-14 flex flex-col items-center text-center" role="status">
            <RingMark size={56} className="animate-spin [animation-duration:2.4s]" />
            <h3 className="font-display text-[26px] mt-6">Sending the prompt</h3>
            <p className="text-[15px] text-[#A9C2B3] mt-1">Connecting to M-Pesa…</p>
          </div>
        )}

        {step === 'waiting' && (
          <div className="px-6 py-12 flex flex-col items-center text-center" role="status" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-canopy flex items-center justify-center ak-pulse">
              <Smartphone size={36} className="text-mint" aria-hidden="true" />
            </div>
            <h3 className="font-display text-[28px] mt-6">Check your phone</h3>
            <p className="text-[15px] text-[#C9DACF] mt-2 max-w-[32ch]">Enter your M-Pesa PIN to pay {formatKsh(parsed)}. We&apos;ll confirm here as soon as Safaricom does.</p>
            <p className="text-[13px] text-[#8FAA9B] mt-6 max-w-[36ch]">Paid but still waiting? Close this and check again in a minute. Confirmed payments always show in your history.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center" role="status" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-mint text-forest flex items-center justify-center">
              <Check size={38} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h3 className="font-display text-[30px] mt-6">Payment confirmed</h3>
            <p className="text-[15px] text-[#C9DACF] mt-1">{formatKsh(parsed)} is in the group record.</p>
            {receiptNumber && <p className="font-mono text-[13px] text-[#8FAA9B] mt-3">M-Pesa {receiptNumber}</p>}
            <button onClick={onClose} className="mt-8 w-full h-[54px] rounded-full bg-mint text-forest font-semibold text-[16px]">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
