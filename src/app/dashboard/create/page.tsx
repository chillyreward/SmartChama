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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Step 1: The Form */}
        {step === 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="mb-6">
              <Link href="/dashboard" className="text-slate-500 hover:text-white flex items-center gap-2 text-sm mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white">Create New Chama</h1>
              <p className="text-slate-400">Set up your group and invite members.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Chama Name</label>
                <input type="text" required placeholder="e.g. Family Savings" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Contribution (KES)</label>
                <input type="number" required placeholder="e.g. 5000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none" />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 rounded-xl transition-all"
              >
                {isLoading ? "Creating Group..." : "Create Chama"}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Success & PIN */}
        {step === 2 && (
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Chama Created!</h2>
            <p className="text-slate-400 mb-8">Share this PIN with members to let them join.</p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 mb-8">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">GROUP PIN</p>
              <div className="text-5xl font-mono font-black text-emerald-400 tracking-widest flex items-center justify-center gap-4">
                {pin}
                <button onClick={() => navigator.clipboard.writeText(pin)} className="p-2 hover:bg-slate-800 rounded-lg">
                  <Copy className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <button 
              onClick={() => router.push("/dashboard?role=admin")}
              className="w-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-4 rounded-xl transition-all"
            >
              Go to Group Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}