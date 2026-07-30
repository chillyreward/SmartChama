"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateChamaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = Form, 2 = Success
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // GENERATE RANDOM PIN (e.g., 4821)
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
      setPin(randomPin);
      setStep(2);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="w-full max-w-lg">
        
        {/* Step 1: The Form */}
        {step === 1 && (
          <div 
            className="rounded-3xl p-8 shadow-xl transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="mb-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold font-geist" style={{ color: 'var(--text-primary)' }}>Create New Chama</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set up your group and invite members.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Chama Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Family Savings" 
                  className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    borderWidth: '1px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Monthly Contribution (KES)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. 5000" 
                  className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    borderWidth: '1px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-xl transition-all shadow-md"
              >
                {isLoading ? "Creating Group..." : "Create Chama"}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Success & PIN */}
        {step === 2 && (
          <div 
            className="rounded-3xl p-8 text-center relative overflow-hidden shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#22C55E]"></div>
            
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-[#22C55E]" />
            </div>

            <h2 className="text-2xl font-bold mb-2 font-geist" style={{ color: 'var(--text-primary)' }}>Chama Created!</h2>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Share this PIN with members to let them join.</p>

            <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: 'var(--text-muted)' }}>GROUP PIN</p>
              <div className="text-5xl font-mono font-black text-[#22C55E] tracking-widest flex items-center justify-center gap-4">
                {pin}
                <button onClick={() => navigator.clipboard.writeText(pin)} className="p-2 rounded-lg hover:opacity-80">
                  <Copy className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => router.push("/dashboard?role=admin")}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-xl transition-all shadow-md"
            >
              Go to Group Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}