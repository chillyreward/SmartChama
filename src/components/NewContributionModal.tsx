'use client'
import { useState, useEffect } from 'react'
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
        })
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
      
      const pollInterval = setInterval(async () => {
        attempts++
        
        const { data: contribution } = await supabase
          .from('contributions_v2')
          .select('status, mpesa_receipt')
          .eq('mpesa_checkout_request_id', data.checkoutRequestId)
          .single()
        
        if (contribution?.status === 'confirmed') {
          clearInterval(pollInterval)
          setReceiptNumber(contribution.mpesa_receipt)
          setStep('success')
        }
        
        if (contribution?.status === 'failed') {
          clearInterval(pollInterval)
          setError('Payment was cancelled or failed. Please try again.')
          setStep('form')
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setStep('form')
          setError('Payment timed out. If you completed the payment, it will be recorded shortly. If not, please try again.')
        }
      }, 3000)
      
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      setStep('form')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
        
        {/* Handle (mobile) */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* STEP: FORM */}
        {step === 'form' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-bold">New Contribution</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Info box */}
            <div className="rounded-xl p-4 mb-5 flex gap-3"
              style={{ backgroundColor: 'transparent', borderLeft: '3px solid #22C55E' }}>
              <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ color: '#22C55E' }}>info</span>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
              </p>
            </div>

            {/* Direct Admin Custody Warning */}
            {paymentConfig && (
              <div className="rounded-xl p-4 mb-5 border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 text-[13px] flex gap-3">
                <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-500 flex-shrink-0">warning</span>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-400 text-left">Direct Admin Custody Warning</p>
                  <p className="mt-1 text-amber-700 dark:text-amber-500 leading-normal text-left">
                    Your funds will go directly to the group administrator's account ({paymentConfig.account_name || 'Admin Pool'}) via{' '}
                    {paymentConfig.payment_type === 'till' && `Till No: ${paymentConfig.till_number}`}
                    {paymentConfig.payment_type === 'paybill' && `Paybill: ${paymentConfig.paybill_number} (Acct: ${paymentConfig.account_number})`}
                    {paymentConfig.payment_type === 'phone' && `M-Pesa: ${paymentConfig.phone_number}`}
                    . SmartChama does not hold or escrow these funds.
                  </p>
                </div>
              </div>
            )}

            {!loadingConfig && !paymentConfig && (
              <div className="rounded-xl p-4 mb-5 border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 text-[13px] flex gap-3">
                <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-500 flex-shrink-0">warning</span>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-400 text-left">Direct Custody Warning</p>
                  <p className="mt-1 text-amber-700 dark:text-amber-500 leading-normal text-left">
                    Funds go directly to the group administrator's custody. SmartChama does not hold or escrow these funds.
                  </p>
                </div>
              </div>
            )}

            {/* Phone field */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-muted)' }}>M-Pesa Phone Number</label>
              <div className="flex">
                <div className="flex items-center px-3 rounded-l-xl border border-r-0 text-[14px] font-medium"
                  style={{ backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  +254
                </div>
                <input
                  type="tel"
                  value={phone.replace('+254', '').replace('254', '')}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 px-4 py-3 rounded-r-xl border text-[15px] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                />
              </div>
            </div>

            {/* Amount field */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-muted)' }}>Amount (KSh)</label>
              <div className="flex">
                <div className="flex items-center px-3 rounded-l-xl border border-r-0 text-[14px] font-medium"
                  style={{ backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  KSh
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="5000"
                  className="flex-1 px-4 py-3 rounded-r-xl border text-[15px] focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                />
              </div>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Group contribution: KSh {defaultAmount.toLocaleString('en-KE')}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[13px] text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-xl text-[16px] font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] active:scale-[0.98] transition-all">
              Send M-Pesa Request
            </button>
          </>
        )}

        {/* STEP: SENDING */}
        {step === 'sending' && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F0FDF4] dark:bg-[#052e16] flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-[32px] text-[#22C55E]">send</span>
            </div>
            <h3 className="text-[18px] font-semibold">Sending request...</h3>
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Connecting to M-Pesa</p>
          </div>
        )}

        {/* STEP: WAITING FOR PIN */}
        {step === 'waiting' && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F0FDF4] dark:bg-[#052e16] flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>
                phone_android
              </span>
            </div>
            <h3 className="text-[20px] font-bold">Check your phone</h3>
            <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
              An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Waiting for confirmation...</p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F0FDF4] dark:bg-[#052e16] flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h3 className="text-[22px] font-bold">Payment confirmed</h3>
            <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
              KSh {parseFloat(amount).toLocaleString('en-KE')} recorded successfully.
            </p>
            {receiptNumber && (
              <div className="rounded-xl px-4 py-2 text-[13px] font-mono"
                style={{ backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                Receipt: {receiptNumber}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-2 w-full py-4 rounded-xl text-[16px] font-semibold bg-[#22C55E] text-white">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
