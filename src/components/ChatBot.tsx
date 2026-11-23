'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, Sparkles, SendHorizontal } from 'lucide-react'

interface Message {
  id: number
  from: 'user' | 'bot'
  text: string
  time: string
}

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() || ''
  // Inside the app the bottom tab bar sits at the foot of the screen on phones
  const inApp = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'bot',
      text: 'Hello! I am the Akibora AI Assistant. I can help you with contributions, credit scores, group management, and M-Pesa payments. What would you like to know?',
      time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || typing) return

    const userMsg: Message = {
      id: Date.now(),
      from: 'user',
      text,
      time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      const history = messages
        .filter(m => m.id !== 0)
        .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      })

      const data = await res.json()
      const answer = data.reply || data.error || 'Sorry, I could not get a response. Please try again.'

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: 'Network error. Please check your connection and try again.',
        time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setTyping(false)
    }
  }

  const suggestedQuestions = [
    'How to contribute?',
    'What is a credit score?',
    'How does the merry-go-round work?',
    'How do I invite members?',
    'Where does money go?'
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed right-4 sm:right-6 z-40 w-14 h-14 rounded-full bg-lavender text-lavender-ink shadow-[0_10px_28px_rgba(0,0,0,.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ${inApp ? 'bottom-[92px] lg:bottom-6' : 'bottom-6'}`}
        aria-label={open ? 'Close the Akibora assistant' : 'Ask the Akibora assistant'}
        aria-expanded={open}>
        {open ? (
          <X size={24} aria-hidden="true" />
        ) : (
          <Sparkles size={24} aria-hidden="true" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          role="dialog" aria-label="Akibora assistant"
          className={`fixed right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] h-[min(520px,70dvh)] rounded-[24px] flex flex-col shadow-2xl overflow-hidden ${inApp ? 'bottom-[160px] lg:bottom-24' : 'bottom-24'}`}
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ backgroundColor: '#0E1F18' }}>
            <div className="w-9 h-9 rounded-full bg-lavender text-lavender-ink flex items-center justify-center">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-[15px] leading-tight">Akibora Assistant</p>
              <p className="text-white/70 text-[12px] leading-none mt-0.5">Answers questions about using Akibora</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-moss flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Sparkles size={13} className="text-white" aria-hidden="true" />
                  </div>
                )}
                <div
                  className="max-w-[78%] rounded-2xl px-4 py-2.5 text-left"
                  style={{
                    backgroundColor: msg.from === 'user' ? '#3FA673' : 'var(--bg-subtle)',
                    color: msg.from === 'user' ? 'white' : 'var(--text-primary)',
                    borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                  }}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-[10px] mt-1" style={{ color: msg.from === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-moss flex items-center justify-center">
                  <Sparkles size={13} className="text-white" aria-hidden="true" />
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[var(--ak-solid)] animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}>
            {suggestedQuestions.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={typing}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors hover:bg-[var(--ak-solid)] hover:text-white disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
              placeholder="Ask about Akibora..."
              className="flex-1 px-4 py-2.5 rounded-xl text-[14px] focus:outline-none focus:border-[var(--ak-brand-ink)] border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              className="w-10 h-10 rounded-xl bg-[var(--ak-solid)] text-white flex items-center justify-center hover:bg-[var(--ak-solid)] disabled:opacity-40 transition-colors flex-shrink-0">
              <SendHorizontal size={18} aria-hidden="true" />
            </button>
          </div>

        </div>
      )}
    </>
  )
}
