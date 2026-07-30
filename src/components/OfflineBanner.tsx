'use client'
import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true)
      setWasOffline(true)
    }
    function handleOnline() {
      setIsOffline(false)
      // Show "back online" message briefly then hide
      setTimeout(() => setWasOffline(false), 3000)
    }

    setIsOffline(!navigator.onLine)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !wasOffline) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 py-2.5 px-4 text-[13px] font-medium transition-all duration-300"
      style={{
        backgroundColor: isOffline ? '#F59E0B' : '#22C55E',
        color: isOffline ? '#000000' : '#ffffff'
      }}
    >
      <span className="material-symbols-outlined text-[18px]">
        {isOffline ? 'wifi_off' : 'wifi'}
      </span>
      {isOffline
        ? 'You are offline. Some features are unavailable.'
        : 'Back online. Syncing your data...'}
    </div>
  )
}
