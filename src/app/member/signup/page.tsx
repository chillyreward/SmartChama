"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Wallet, Shield, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function MemberSignup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [inviteToken, setInviteToken] = useState("");
  const [chamaName, setChamaName] = useState("");
  const [chamaId, setChamaId] = useState("");
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("invite");
    if (token) {
      setInviteToken(token);
      validateToken(token);
    } else {
      setValidatingToken(false);
      setError("No invite code provided. Please use a valid invite link.");
    }
  }, [searchParams]);

  const validateToken = async (token: string) => {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from("invite_tokens")
        .select("*, chamas(id, name)")
        .eq("token", token)
        .eq("is_active", true)
        .single();

      if (tokenError || !tokenData) {
        setError("Invalid or expired invite code.");
        setTokenValid(false);
        return;
      }

      if (tokenData.max_uses && tokenData.current_uses >= tokenData.max_uses) {
        setError("This invite code has reached its maximum usage limit.");
        setTokenValid(false);
        return;
      }

      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        setError("This invite code has expired.");
        setTokenValid(false);
        return;
      }

      // Validate that we have chama data
      if (!tokenData.chamas || !tokenData.chamas.id) {
        setError("Invalid invite code - chama not found.");
        setTokenValid(false);
        return;
      }

      setChamaName(tokenData.chamas.name);
      setChamaId(tokenData.chamas.id);
      setTokenValid(true);
    } catch (err) {
      console.error("Error validating token:", err);
      setError("Failed to validate invite code.");
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !idNumber || !email || !phone || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!chamaId) {
      setError("Invalid invite code - missing chama information. Please request a new invite link.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Privacy Policy & Terms");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!phone.match(/^\+?[0-9]{10,15}$/)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Creating auth user with email:", email);

      let authData, authError;
      
      try {
        const result = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
              id_number: idNumber,
            },
          },
        });
        authData = result.data;
        authError = result.error;
      } catch (signUpError: any) {
        console.error("Network error during signup:", signUpError);
        throw new Error("Network error: Unable to connect to authentication service. Please check your internet connection.");
      }

      if (authError) {
        console.error("Auth signup error:", authError);
        
        // Provide user-friendly error messages
        let userMessage = authError.message || "Failed to create account";
        
        if (authError.message?.includes('already registered')) {
          userMessage = "This phone number is already registered. Please login instead.";
        } else if (authError.message?.includes('email')) {
          userMessage = "Invalid email format. Please check your phone number.";
        } else if (authError.message?.includes('password')) {
          userMessage = "Password must be at least 8 characters long.";
        } else if (authError.message?.includes('rate limit')) {
          userMessage = "Too many signup attempts. Please wait a minute and try again.";
        }
        
        throw new Error(userMessage);
      }

      if (!authData.user) {
        throw new Error("Failed to create account - no user data returned");
      }

      console.log("Auth user created successfully, user_id:", authData.user.id);

      const { data: tokenData, error: tokenError } = await supabase
        .from("invite_tokens")
        .select("*")
        .eq("token", inviteToken)
        .eq("is_active", true)
        .single();

      if (tokenError) {
        console.error("Token fetch error:", tokenError);
        
        if (tokenError.code === 'PGRST116') {
          throw new Error("Invite code no longer valid. Please request a new invite link.");
        } else {
          throw new Error(`Token validation failed: ${tokenError.message}`);
        }
      }

      if (!tokenData) {
        throw new Error("Invite code not found. Please request a new invite link.");
      }

      console.log("Token validated, creating member record...");
      console.log("Chama ID:", chamaId, "Token data chama_id:", tokenData.chama_id);

      // Use chama_id from token data to ensure we have the correct UUID
      const memberChamaId = tokenData.chama_id || chamaId;
      
      if (!memberChamaId) {
        throw new Error("Invalid invite code - missing chama information.");
      }

      const { error: memberError } = await supabase
        .from("members")
        .insert([
          {
            user_id: authData.user.id,
            chama_id: memberChamaId,
            full_name: fullName,
            id_number: idNumber,
            phone_number: phone,
            phone_verified: true,
            email: email,
            joined_via_token: inviteToken,
          },
        ]);

      if (memberError) {
        console.error("Failed to create member profile:", memberError);
        
        if (memberError.message.includes("relation") || memberError.message.includes("does not exist")) {
          throw new Error("Database setup incomplete. Please contact your admin to run the members table SQL script.");
        } else if (memberError.code === '23505') {
          throw new Error("This ID number or phone number is already registered in this chama.");
        } else {
          throw new Error(`Failed to create member profile: ${memberError.message}`);
        }
      }

      console.log("Member record created, updating token usage...");

      const updateResult = await supabase
        .from("invite_tokens")
        .update({ current_uses: tokenData.current_uses + 1 })
        .eq("id", tokenData.id);

      if (updateResult.error) {
        console.warn("Failed to update token usage count:", updateResult.error);
      }

      console.log("Signup complete! Redirecting to login...");

      alert(`Welcome to ${chamaName}! Your account has been created.\n\nPlease login with:\nEmail: ${email}\nPassword: (the password you just created)`);
      
      // Redirect to unified login page
      router.push("/login");
    } catch (err: any) {
      console.error("Signup error:", err);
      
      if (err.message.includes("fetch")) {
        setError("Connection error. Please check your internet connection and try again.");
      } else if (err.message.includes("User already registered")) {
        setError("This phone number is already registered. Please login instead.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Validating invite code...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invite Code</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Chama Badge */}
            <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div className="text-center">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Joining</p>
                <p className="text-sm font-bold text-white">{chamaName}</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Create Your Account</h1>
              <p className="text-slate-400 text-sm">Enter your details to join the chama</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-1">
                  ID Number
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter your ID number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all placeholder:text-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1 ml-1">Include country code (e.g., +254)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all pr-12 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1 ml-1">Must be at least 8 characters</p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="terms" className="text-sm text-slate-400">
                  I agree to the{" "}
                  <Link href="/privacy" target="_blank" className="text-emerald-400 font-semibold hover:text-emerald-300">
                    Privacy Policy
                  </Link>
                  {" & "}
                  <Link href="/terms" target="_blank" className="text-emerald-400 font-semibold hover:text-emerald-300">
                    Terms of Service
                  </Link>
                  <span className="text-red-400 ml-1">*</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="w-full bg-white hover:bg-emerald-50 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  "Join Chama"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300">
                  Go to Login
                </Link>
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8 flex items-center justify-center gap-2">
          <Shield className="w-3 h-3" /> Secure Registration • © 2026 SmartChama
        </p>

      </div>
    </div>
  );
}
