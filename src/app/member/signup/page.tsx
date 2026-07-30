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

      await supabase
        .from("invite_tokens")
        .update({ current_uses: tokenData.current_uses + 1 })
        .eq("id", tokenData.id);

      alert(`Welcome to ${chamaName}! Your account has been created.\n\nPlease login with:\nEmail: ${email}\nPassword: (the password you just created)`);
      
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Validating invite code...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 font-geist" style={{ color: 'var(--text-primary)' }}>Invalid Invite Code</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <Link
            href="/login"
            className="inline-block bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors" style={{ backgroundColor: 'var(--bg-page)' }}>
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#22C55E] via-teal-500 to-[#16A34A]"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="p-3 rounded-2xl shadow-xl transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Wallet className="w-8 h-8 text-[#22C55E]" />
          </div>
        </div>

        {/* The Card */}
        <div className="rounded-[32px] p-8 shadow-2xl transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Chama Badge */}
            <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <CheckCircle className="w-5 h-5 text-[#22C55E]" />
              <div className="text-center">
                <p className="text-xs text-[#22C55E] font-bold uppercase tracking-wider">Joining</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{chamaName}</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2 font-geist" style={{ color: 'var(--text-primary)' }}>Create Your Account</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enter your details to join the chama</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                  ID Number
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter your ID number"
                  className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                />
                <p className="text-xs mt-1 ml-1" style={{ color: 'var(--text-muted)' }}>Include country code (e.g., +254)</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl px-4 py-3 outline-none focus:border-[#22C55E] transition-all pr-12"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', borderWidth: '1px', color: 'var(--text-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs mt-1 ml-1" style={{ color: 'var(--text-muted)' }}>Must be at least 8 characters</p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                />
                <label htmlFor="terms" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  I agree to the{" "}
                  <Link href="/privacy" target="_blank" className="text-[#22C55E] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                  {" & "}
                  <Link href="/terms" target="_blank" className="text-[#22C55E] font-semibold hover:underline">
                    Terms of Service
                  </Link>
                  <span className="text-red-400 ml-1">*</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  "Join Chama"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Already have an account?{" "}
                <Link href="/login" className="text-[#22C55E] font-semibold hover:underline">
                  Go to Login
                </Link>
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-8 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Shield className="w-3 h-3" /> Secure Registration • © 2026 SmartChama
        </p>

      </div>
    </div>
  );
}
