"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate email format
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log("=== Login Started ===");
      console.log("Email:", email);

      // Step 1: Authenticate with Supabase Auth (email + password)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Auth error:", authError);
        setError("Invalid credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Invalid credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      console.log("✅ Authentication successful");
      console.log("User ID:", authData.user.id);

      // Step 2: Query chama_admins table to verify admin authorization
      const { data: adminData, error: adminError } = await supabase
        .from('chama_admins')
        .select('*')
        .eq('admin_user_id', authData.user.id)
        .single();

      console.log("Admin query result:", adminData);
      console.log("Admin query error:", adminError);

      // Step 3: Check if user is an admin
      if (adminError || !adminData) {
        console.error("❌ User is not an admin");
        
        // Sign out the user since they're not authorized
        await supabase.auth.signOut();
        
        setError("Access denied. Admin credentials required.");
        setLoading(false);
        return;
      }

      // Step 4: Success - User is authorized as admin
      console.log("✅ Admin authorization successful!");
      console.log("Admin Name:", adminData.full_name);

      // Redirect to admin dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError("Invalid credentials. Please check your information and try again.");
    } finally {
      setLoading(false);
      console.log("=== Login Ended ===");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white px-6 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900">SmartChama</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-6 py-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4 items-center">
          {/* Green Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white px-6 py-8 rounded-2xl shadow-lg">
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t.growTogether}</h1>
            <p className="text-emerald-50 text-sm">{t.tagline}</p>
          </div>

          {/* Welcome Text */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{t.welcome}</h2>
            <p className="text-slate-500">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          {/* Title */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-bold text-slate-900">{t.adminLogin}</h3>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.phoneOrEmail}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.enterContact}
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  title="Please enter a valid email address"
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.createPassword}
                  className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.signingIn : t.loginToPortal}
            </button>

            <div className="text-center text-slate-400 text-xs">{t.or}</div>

            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 text-sm rounded-full transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-base">+</span>
              {t.signUpAdmin}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-slate-500 text-xs">
              {t.havingTrouble}{" "}
              <a href="#" className="text-emerald-600 font-medium hover:underline">
                {t.contactSupport}
              </a>
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 px-4">
          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">{t.bankSecurity}</h3>
            <p className="text-slate-500 text-xs">{t.bankSecurityDesc}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">{t.smartAnalytics}</h3>
            <p className="text-slate-500 text-xs">{t.smartAnalyticsDesc}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 mb-1 text-sm">{t.aiAssistant}</h3>
            <p className="text-slate-500 text-xs">{t.aiAssistantDesc}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full text-center py-3 mt-4">
          <p className="text-slate-400 text-xs">© 2026 SmartChama Fintech. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
