'use client'
import { useState, useRef, useEffect } from 'react'
import { responses } from '@/data/chatbot-responses'

interface Message {
  id: number
  from: 'user' | 'bot'
  text: string
  time: string
}

function getResponse(input: string): string {
  const lower = input.toLowerCase().trim()
  
  for (const r of responses) {
    if (r.triggers[0] === 'default') 
      continue
    if (r.triggers.some(t => lower.includes(t))) {
      return r.answer
    }
  }
  
  // Return default
  return responses.find(
    r => r.triggers[0] === 'default'
  )?.answer || 'I am not sure about that. Try asking about contributions, loans, or trust scores.'
}

export function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'bot',
      text: 'Hello! I am the SmartChama assistant. Ask me anything about contributions, loans, trust scores, or how the platform works.',
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
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = {
      id: Date.now(),
      from: 'user',
      text,
      time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simulate typing delay (300-800ms feels natural)
    const delay = 300 + Math.random() * 500

    setTimeout(() => {
      const answer = getResponse(text)
      const botMsg: Message = {
        id: Date.now() + 1,
        from: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMsg])
      setTyping(false)
    }, delay)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#22C55E] text-white shadow-xl shadow-green-500/30 flex items-center justify-center hover:bg-[#16A34A] hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Open chat">
        <span className="material-symbols-outlined text-[28px]">
          {open ? 'close' : 'chat'}
        </span>
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)'
          }}>

          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              backgroundColor: '#22C55E'
            }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">
                support_agent
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-semibold text-[15px] leading-tight">
                SmartChama Assistant
              </p>
              <p className="text-white/70 text-[12px] leading-none mt-0.5">
                Always here to help
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white">
              <span className="material-symbols-outlined text-[22px]">
                close
              </span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#22C55E] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-[14px]">
                      smart_toy
                    </span>
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-left`}
                  style={{
                    backgroundColor: msg.from === 'user' ? '#22C55E' : 'var(--bg-subtle)',
                    color: msg.from === 'user' ? 'white' : 'var(--text-primary)',
                    borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                  }}>
                  <p className="text-[14px] leading-relaxed">
                    {msg.text}
                  </p>
                  <p className={`text-[10px] mt-1 ${msg.from === 'user' ? 'text-white/70' : ''}`}
                    style={msg.from === 'bot' ? { color: 'var(--text-muted)' } : {}}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#22C55E] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[14px]">
                    smart_toy
                  </span>
                </div>
                <div className="rounded-2xl px-4 py-3 animate-pulse"
                  style={{
                    backgroundColor: 'var(--bg-subtle)'
                  }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#22C55E]"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          <div
            className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0"
            style={{
              borderTop: '1px solid var(--border)'
            }}>
            {[
              'How to contribute?',
              'What is trust score?',
              'How to get a loan?',
              'Where does money go?'
            ].map(q => (
              <button
                key={q}
                onClick={() => {
                  setInput(q)
                  setTimeout(() => {
                    handleSend()
                  }, 50)
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--green-text)',
                  border: '1px solid var(--border-strong)'
                }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
            style={{
              borderTop: '1px solid var(--border)'
            }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') 
                  handleSend()
              }}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-2.5 rounded-xl text-[14px] focus:outline-none focus:border-[#22C55E] border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-[#22C55E] text-white flex items-center justify-center hover:bg-[#16A34A] disabled:opacity-40 transition-colors flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                send
              </span>
            </button>
          </div>

        </div>
      )}
    </>
  )
}
