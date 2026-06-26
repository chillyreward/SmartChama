'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingScreen({ 
  onComplete 
}: { 
  onComplete?: () => void 
}) {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Skip if already loaded in this session
    const isFirst = !sessionStorage.getItem('sc-initial-load')
    if (!isFirst) {
      setVisible(false)
      if (onComplete) onComplete()
      return
    }

    const duration = 1800
    const interval = 16
    const steps = duration / interval
    const increment = 100 / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment

      const eased = current < 80
        ? current * 1.05
        : 80 + (current - 80) * 0.4

      const clamped = Math.min(
        100, Math.round(eased)
      )
      setProgress(clamped)

      if (current >= 100) {
        clearInterval(timer)
        setProgress(100)
        sessionStorage.setItem('sc-initial-load', 'done')
        setTimeout(() => {
          setVisible(false)
          setTimeout(() => {
            if (onComplete) onComplete()
          }, 300)
        }, 400)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className={`
        fixed inset-0 z-[9999]
        flex flex-col items-center 
        justify-center gap-12
        transition-opacity duration-300
        ${!visible 
          ? 'opacity-0' 
          : 'opacity-100'}
      `}
      style={{ 
        backgroundColor: 
          'var(--bg-page, #FFFFFF)' 
      }}>

      {/* Logo and wordmark */}
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/favicon.svg"
          alt="SmartChama"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
          priority
        />
        <span
          className="text-[28px] font-bold tracking-tight"
          style={{ 
            color: 'var(--text-primary, #0A0A0A)' 
          }}>
          SmartChama
        </span>
      </div>

      {/* Progress */}
      <div className="w-64 flex flex-col gap-3">

        <div className="flex justify-between items-center">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ 
              color: 'var(--text-muted, #A3A3A3)' 
            }}>
            Loading
          </span>
          <span
            className="text-[13px] font-bold tabular-nums"
            style={{ 
              color: 'var(--text-primary, #0A0A0A)' 
            }}>
            {progress}%
          </span>
        </div>

        <div
          className="h-[2px] w-full rounded-full overflow-hidden"
          style={{ 
            backgroundColor: 'var(--border, #E5E7EB)' 
          }}>
          <div
            className="h-full rounded-full bg-[#22C55E] transition-all duration-75 ease-linear"
            style={{ 
              width: `${progress}%` 
            }}
          />
        </div>

      </div>

      <p
        className={`
          text-[13px]
          transition-opacity 
          duration-500
          ${progress > 70 
            ? 'opacity-100' 
            : 'opacity-0'}
        `}
        style={{ 
          color: 'var(--text-muted, #A3A3A3)' 
        }}>
        Financial infrastructure for community wealth.
      </p>

    </div>
  )
}
