"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Users, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length < 8) {
      setPasswordStrength("weak");
      return false;
    }
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength < 3) {
      setPasswordStrength("weak");
      return false;
    } else if (strength === 3) {
      setPasswordStrength("medium");
      return true;
    } else {
      setPasswordStrength("strong");
      return true;
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate email format
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address (e.g., user@example.com)");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (passwordStrength === "weak") {
      setError("Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters");
      setLoading(false);
      return;
    }

    console.log("=== Admin Signup Started ===");
    console.log("Full Name:", fullName);
    console.log("Email:", email);
    console.log("Phone:", phone);

    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: fullName,
            phone: phone,
            role: "admin"
          }
        }
      });

      console.log("Supabase Auth Response:", authData);
      console.log("Supabase Auth Error:", authError);

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Ensure session is set before inserting into table
      if (!authData.session) {
        console.warn("No session returned, but user created. User may need to verify email first.");
      }

      // Step 2: Insert admin details into chama_admins table
      const { data: adminData, error: adminError } = await supabase
        .from('chama_admins')
        .insert([
          {
            admin_user_id: authData.user.id,
            full_name: fullName,
            phone_number: phone,
            email: email
          }
        ])
        .select();

      console.log("Admin Table Insert Response:", adminData);
      console.log("Admin Table Insert Error:", adminError);

      if (adminError) {
        // If table insert fails, sign out the user
        console.error("Failed to insert admin data:", adminError);
        
        // Sign out the newly created user
        await supabase.auth.signOut();
        
        throw new Error(`Failed to create admin profile: ${adminError.message}`);
      }

      console.log("✅ Admin signup successful!");
      
      // Show success message
      alert(`Registration successful!\n\nYour account has been created with:\n- Email: ${email}\n- Phone: ${phone}\n\nPlease check your email to verify your account before logging in.`);
      
      // Redirect to login
      router.push("/login");
    } catch (err: any) {
      console.error("❌ Admin signup error:", err);
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
      console.log("=== Admin Signup Ended ===");
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
      <main className="flex-1 flex flex-col items-center px-4 pb-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 my-4">
          {/* Title */}
          <div className="mb-4 text-center">
            <h3 className="text-lg font-bold text-slate-900">{t.signUpAdmin}</h3>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleAdminSignup} className="space-y-3">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.fullName}
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.enterFullName}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.phone}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.enterPhone}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.enterEmail}
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Please enter a valid email address (e.g., user@example.com)"
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
                    onChange={handlePasswordChange}
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
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      passwordStrength === "weak" ? "w-1/3 bg-red-500" :
                      passwordStrength === "medium" ? "w-2/3 bg-yellow-500" :
                      "w-full bg-green-500"
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength === "weak" ? "text-red-500" :
                  passwordStrength === "medium" ? "text-yellow-500" :
                  "text-green-500"
                }`}>
                  {passwordStrength === "weak" ? "Weak" :
                   passwordStrength === "medium" ? "Medium" : "Strong"}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 -mt-2">
              Min 8 characters, include uppercase, lowercase, numbers & special characters
            </p>

            <button
              type="submit"
              disabled={loading || passwordStrength === "weak"}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? t.creatingAccount : t.signUpAdmin}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-slate-500 text-xs">
              Have an account?{" "}
              <a href="/login" className="text-emerald-600 font-medium hover:underline">
                Sign in
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
