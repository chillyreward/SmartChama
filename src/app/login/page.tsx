"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, ArrowRight, ShieldCheck, Fingerprint, Loader2, 
  Wallet, ChevronLeft, CheckCircle 
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=Email, 2=OTP, 3=Success
  const [role, setRole] = useState("member"); // 'member' or 'admin'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // Handle OTP Input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  // Step 1: Send Code
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Fake API delay
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  // Step 2: Verify Code
  const handleVerify = () => {
    const code = otp.join("");
    setLoading(true);
    
    setTimeout(() => {
      if (code === "1234") {
        setStep(3); // Success!
        setTimeout(() => {
          // Redirect based on role
          if (role === 'admin') {
            router.push("/dashboard/create"); // Go to create chama
          } else {
            router.push("/dashboard?user=Lenny"); // Go to dashboard
          }
        }, 1500);
      } else {
        alert("WRONG CODE! Try 1234"); // Cheat code for demo
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-900"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-2xl shadow-emerald-500/10">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* The Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          
          {/* STEP 1: EMAIL ENTRY */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-slate-400 text-sm">Enter your credentials to access the vault.</p>
              </div>

              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl mb-6 border border-white/5">
                <button 
                  onClick={() => setRole("member")}
                  className={`py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'member' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  Member
                </button>
                <button 
                  onClick={() => setRole("admin")}
                  className={`py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'admin' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  Create Chama
                </button>
              </div>

              <form onSubmit={handleSendCode}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="lenny@smartchama.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                    />
                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white hover:bg-emerald-50 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                    <>
                      Send Secure Code <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP ENTRY */}
          {step === 2 && (
            <div className="animate-in fade-in zoom-in duration-300">
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white mb-6 flex items-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <Fingerprint className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Security Check</h2>
                <p className="text-slate-400 text-sm mt-1">Enter the code sent to <span className="text-white">{email}</span></p>
                <p className="text-xs text-emerald-500/50 mt-2 font-mono">(Hint: Use 1234)</p>
              </div>

              <div className="flex justify-center gap-3 mb-8">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-14 h-16 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.3)] outline-none transition-all"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                {loading ? "Verifying..." : "Unlock Dashboard"}
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESS ANIMATION */}
          {step === 3 && (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.6)]">
                <CheckCircle className="w-12 h-12 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Granted</h2>
              <p className="text-emerald-400 animate-pulse">Redirecting to secure server...</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8 flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" /> 256-Bit End-to-End Encryption
        </p>

      </div>
    </div>
  );
}