"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            Join thousands of Kenyan chamas already building their financial identity with SmartChama.
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
            <h1 className="text-display-sm font-geist text-on-surface text-center">Create your account</h1>
            <p className="text-body-lg text-on-secondary-container text-center mt-1">Free forever. No bank account required.</p>
          </div>

          <form method="POST" action="#" className="flex flex-col gap-4">
            
            {/* 1. Full Name */}
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                required
                placeholder="e.g. Grace Wanjiku"
                className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] placeholder:text-gray-400 transition-colors"
              />
            </div>

            {/* 2. Phone Number */}
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">Phone Number</label>
              <div className="flex border border-[#E5E7EB] rounded focus-within:border-[#22C55E] focus-within:ring-1 focus-within:ring-[#22C55E] transition-colors overflow-hidden">
                <div className="bg-surface-container-low border-r border-[#E5E7EB] px-3 flex items-center justify-center">
                  <span className="text-body-sm text-on-secondary-container font-medium">+254</span>
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  placeholder="712 345 678"
                  className="flex-1 px-4 py-3 text-body-sm text-on-surface focus:outline-none placeholder:text-gray-400 bg-white"
                />
              </div>
              <p className="text-body-sm text-on-secondary-container mt-1">
                Used for M-Pesa integration and login
              </p>
            </div>

            {/* 3. Email Address */}
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                required
                placeholder="name@example.com"
                className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] placeholder:text-gray-400 transition-colors"
              />
            </div>

            {/* 4. Create Password */}
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">Create Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="Min. 8 characters"
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

            {/* 5. Confirm Password */}
            <div>
              <label className="block text-label-caps text-on-surface-variant mb-2">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirm"
                  required
                  placeholder="Re-enter password"
                  className="w-full border border-[#E5E7EB] rounded px-4 py-3 text-body-sm text-on-surface focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] placeholder:text-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#22C55E] text-white py-3 rounded text-headline-sm font-geist hover:bg-[#006e2f] transition-colors mt-2"
            >
              Create Account  →
            </button>
          </form>

          <p className="text-center text-body-sm text-on-secondary-container mt-4">
            By signing up, you agree to our{" "}
            <Link href="#" className="text-[#22C55E] hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="#" className="text-[#22C55E] hover:underline">Privacy Policy</Link>
          </p>

          <div className="text-center mt-6">
            <span className="text-body-sm text-on-secondary-container">Already have an account? </span>
            <Link href="/login" className="text-body-sm text-[#22C55E] font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
