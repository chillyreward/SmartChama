'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export function InstallPrompt() {
  const [deferredPrompt, setDeferred] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('sc-install-dismissed')
    if (dismissed) return

    // Detect platform
    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isAndroid = /android/i.test(ua)

    if (isIos) {
      setPlatform('ios')
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShowBanner(true), 3000)
    }

    if (isAndroid) {
      setPlatform('android')
    }

    // Android Chrome install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setTimeout(() => setShowBanner(true), 3000)
    })

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
    })
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
        setIsInstalled(true)
      }
      setDeferred(null)
    }
  }

  function handleDismiss() {
    setShowBanner(false)
    localStorage.setItem('sc-install-dismissed', Date.now().toString())
  }

  if (!showBanner || isInstalled) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[9998] md:left-auto md:right-6 md:bottom-24 md:w-80 rounded-2xl p-4 shadow-2xl shadow-black/20 animate-slide-up"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '2px solid #22C55E'
      }}
    >
      {/* Close button */}
      <button onClick={handleDismiss} className="absolute top-3 right-3" style={{ color: 'var(--text-muted)' }}>
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Image
          src="/favicon.svg"
          alt="SmartChama"
          width={40}
          height={40}
          className="h-10 w-10 object-contain flex-shrink-0"
        />
        <div>
          <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Install SmartChama
          </p>
          <p className="text-[13px] mb-3" style={{ color: 'var(--text-secondary)' }}>
            {platform === 'ios'
              ? 'Tap the share button below, then "Add to Home Screen"'
              : 'Install the app for the best experience. Works offline too.'}
          </p>

          {platform === 'android' && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full py-2.5 rounded-xl text-[14px] font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors"
            >
              Install App
            </button>
          )}

          {platform === 'ios' && (
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              Tap Share then Add to Home Screen
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
