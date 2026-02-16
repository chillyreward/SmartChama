"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Wallet, Eye, EyeOff, Shield, TrendingUp, Lightbulb } from "lucide-react";

export default function MemberLogin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Convert phone to email format (same as signup)
      const generatedEmail = `${phone.replace(/\+/g, '')}@smartchama.member`;

      console.log("Attempting login with email:", generatedEmail);

      // Sign in with Supabase Auth using generated email
      let authData, authError;
      
      try {
        const result = await supabase.auth.signInWithPassword({
          email: generatedEmail,
          password,
        });
        authData = result.data;
        authError = result.error;
      } catch (networkError: any) {
        console.error("Network error during login:", networkError);
        throw new Error("Connection error. Please check your internet and try again.");
      }

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(authError.message || "Authentication failed");
      }

      if (!authData.user) {
        throw new Error("Login failed - no user data returned");
      }

      console.log("Auth successful, checking member status...");

      // Check if user is a member
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*, chamas(name)")
        .eq("user_id", authData.user.id)
        .single();

      if (memberError) {
        console.error("Member lookup error:", memberError);
        await supabase.auth.signOut();
        
        if (memberError.code === 'PGRST116') {
          setError("No member account found. Please contact your chama admin.");
        } else if (memberError.message.includes("relation") || memberError.message.includes("does not exist")) {
          setError("Database setup incomplete. Please run the members table SQL script in Supabase.");
        } else {
          setError(`Database error: ${memberError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!memberData) {
        await supabase.auth.signOut();
        setError("Access denied. This account is not registered as a member.");
        setLoading(false);
        return;
      }

      console.log("Login successful, redirecting...");
      // Redirect to member dashboard
      router.push("/member/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      
      if (err.message.includes("fetch")) {
        setError("Connection error. Please check your internet connection and try again.");
      } else if (err.message.includes("Invalid login credentials")) {
        setError("Invalid phone number or password. Please try again.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SmartChama</span>
          </div>
          <LanguageSwitcher />
        </header>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                {t.welcome}
              </h1>
              <p className="text-slate-600">Member Portal - Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500 mt-1">Use the phone number you registered with</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t.password}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.createPassword}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none pr-12 text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.signingIn : t.loginToPortal}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600 text-sm">
                Don't have an account?{" "}
                <Link href="/member/signup" className="text-emerald-500 font-semibold hover:text-emerald-600">
                  Sign up with invite code
                </Link>
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link href="/login" className="text-slate-500 text-sm hover:text-slate-700">
                Are you an admin? Login here
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-slate-500 text-sm">
          © 2026 SmartChama. All rights reserved.
        </footer>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 p-12 flex-col">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">{t.growTogether}</h2>
          <p className="text-emerald-100 text-lg">{t.tagline}</p>
        </div>

        <div className="space-y-6 flex-1 flex flex-col justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">{t.bankSecurity}</h3>
                <p className="text-emerald-100 text-sm">{t.bankSecurityDesc}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">{t.smartAnalytics}</h3>
                <p className="text-emerald-100 text-sm">{t.smartAnalyticsDesc}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">{t.aiAssistant}</h3>
                <p className="text-emerald-100 text-sm">{t.aiAssistantDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
