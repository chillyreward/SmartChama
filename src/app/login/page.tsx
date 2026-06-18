"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err) {
      setError("Failed to initialize Google login.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setError("Password reset email sent. Please check your inbox.");
      }
    } catch (err) {
      setError("Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError || !authData.user) {
        setError("Invalid credentials. Please check your information and try again.");
        setLoading(false);
        return;
      }

      // Fetch member profile
      const { data: member } = await supabase
        .from('members')
        .select('role, chama_id, full_name')
        .eq('user_id', authData.user.id)
        .single();

      if (!member) {
        router.push('/onboarding');
        return;
      }

      if (member.role === 'admin' || member.role === 'chairlady' || member.role === 'treasurer') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
      
    } catch (err: any) {
      setError("Invalid credentials. Please check your information and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-inter">
      {/* LEFT PANEL */}
      <div className="hidden md:flex w-1/2 bg-[#0B0F0C] flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <span className="text-headline-lg font-black font-geist text-white">SmartChama</span>
        </div>

        <div>
          <h2 className="text-display-sm font-geist text-white max-w-sm leading-tight">
            Your contributions build more than savings — they build your financial identity.
          </h2>
          
          <div className="flex flex-col gap-4 mt-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#22C55E]">shield_check</span>
              <span className="text-body-sm text-gray-400">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#22C55E]">payments</span>
              <span className="text-body-sm text-gray-400">M-Pesa Connected & Verified</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#22C55E]">verified_user</span>
              <span className="text-body-sm text-gray-400">Tamper-Proof Contribution Ledger</span>
            </div>
          </div>
        </div>

        <div className="text-body-sm text-gray-600">
          © 2025 SmartChama Technologies Ltd.
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-[#FAFAFA] p-6 sm:p-8">
        <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              <span className="text-headline-sm font-bold font-geist text-on-surface">SmartChama</span>
            </div>
            <h1 className="text-display-sm font-geist text-on-surface text-center">Welcome back</h1>
            <p className="text-body-lg text-on-surface-variant text-center mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-body-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">Phone Number or Email</label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. 0712345678 or name@example.com"
                className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] placeholder:text-gray-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-label-caps text-on-surface-variant">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-body-sm text-[#22C55E] hover:underline bg-transparent border-none p-0 cursor-pointer">Forgot password?</button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] placeholder:text-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-3 rounded text-headline-sm font-geist hover:bg-[#006e2f] transition-colors mt-2 disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? "Signing in..." : "Sign In  →"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#E5E7EB]"></div>
            <div className="text-body-sm text-on-secondary-container whitespace-nowrap">or continue with</div>
            <div className="flex-1 h-px bg-[#E5E7EB]"></div>
          </div>

          <div className="flex flex-col gap-3">
            <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] text-on-surface py-3 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] text-on-surface py-3 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.1119 9.38879C15.1119 6.74104 17.2709 5.48429 17.3752 5.42179C16.1474 3.62754 14.2372 3.33629 13.5907 3.25554C12.0134 3.09054 10.4632 4.18379 9.64345 4.18379C8.8252 4.18379 7.5547 3.27279 6.25195 3.30054C4.5517 3.32829 2.97745 4.29054 2.1007 5.81979C0.3112 8.92254 1.64245 13.5135 3.38545 16.035C4.2367 17.2613 5.23495 18.636 6.55195 18.5775C7.8187 18.519 8.3107 17.7503 9.83695 17.7503C11.3617 17.7503 11.8027 18.5775 13.1257 18.5498C14.4997 18.519 15.3524 17.3198 16.2007 16.0688C17.1854 14.6295 17.5912 13.2383 17.6167 13.1558C17.5882 13.1438 15.1119 12.1955 15.1119 9.38879Z" fill="black"/>
                <path d="M11.854 2.16109C12.562 1.30534 13.036 0.0888422 12.9055 -0.999657C11.968 0.0385928 10.669 0.638593 9.9325 1.50484C9.271 2.27434 8.704 3.52909 8.8615 4.59334C9.9145 4.67509 11.1445 4.02034 11.854 2.16109Z" fill="black"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="text-center mt-6">
            <span className="text-body-sm text-on-secondary-container">Don't have an account? </span>
            <Link href="/signup" className="text-body-sm text-[#22C55E] font-semibold hover:underline">Get started free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}