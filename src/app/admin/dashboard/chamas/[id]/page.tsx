"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import InviteQR from "@/components/InviteQR";
import {
  Building2, Users, CreditCard, Settings, ShieldCheck,
  Loader2, CheckCircle, ArrowLeft, TrendingUp, Wallet
} from "lucide-react";

export default function ChamaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chamaId = params.id as string;

  const [step, setStep] = useState<'pin' | 'verifying' | 'success' | 'content'>('pin');
  const [pin, setPin] = useState(["", "", "", ""]);
  const [chama, setChama] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    fetchChamaDetails();
  }, [chamaId]);

  const fetchChamaDetails = async () => {
    try {
      const { data: chamaData, error } = await supabase
        .from('chamas')
        .select('*')
        .eq('id', chamaId)
        .single();

      if (error) {
        console.error('Error fetching chama:', error);
        router.push('/admin/dashboard/chamas');
        return;
      }

      setChama(chamaData);

      // Fetch member count
      const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('chama_id', chamaId);

      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }

    if (index === 3 && value) {
      verifyPin();
    }
  };

  const verifyPin = () => {
    setStep('verifying');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        setStep('content');
      }, 1000);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#22C55E] animate-spin" />
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>Chama not found</p>
      </div>
    );
  }

  // PIN Verification Screen
  if (step !== 'content') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div 
          className="w-full max-w-md rounded-[32px] p-8 text-center shadow-xl transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {step === 'pin' && (
            <div>
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors"
                style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
              >
                <ShieldCheck className="w-10 h-10 text-[#22C55E]" />
              </div>
              <h2 className="text-2xl font-geist font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Verify Identity</h2>
              <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Enter your PIN to access <br />
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{chama.name}</span>
              </p>

              <div className="flex justify-center gap-4 mb-8">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    id={`pin-${i}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    className="w-12 h-14 rounded-xl text-center text-2xl font-geist font-bold focus:border-[#22C55E] outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                ))}
              </div>
              <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Enter any 4 digits (Demo Mode)</p>
              
              <button
                onClick={() => router.back()}
                className="text-sm flex items-center gap-2 mx-auto hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Chamas
              </button>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-10">
              <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin mx-auto mb-4" />
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Verifying Credentials...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10">
              <CheckCircle className="w-16 h-16 text-[#22C55E] mx-auto mb-4" />
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Access Granted</p>
              <p className="text-[#22C55E] text-sm">Loading Chama Details...</p>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Main Content Screen
  return (
    <div className="p-6 max-w-[1280px] mx-auto w-full font-inter space-y-8 pb-20">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:border-[#22C55E]"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-geist font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              {chama.name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Chama Overview & Management</p>
          </div>
          <InviteQR groupCode={chama.group_code || chama.code || 'CHAMA'} chamaName={chama.name} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <Wallet className="w-5 h-5 text-[#22C55E]" />
            </div>
            <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Total Balance</p>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            KES {parseFloat(chama.total_balance || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#22C55E]">+0% this month</p>
        </div>

        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <TrendingUp className="w-5 h-5 text-[#22C55E]" />
            </div>
            <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Investment Goal</p>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            KES {parseFloat(chama.investment_goal || 0).toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Target amount</p>
        </div>

        <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <Users className="w-5 h-5 text-[#22C55E]" />
            </div>
            <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Members</p>
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {memberCount}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Active members</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span className="w-1 h-5 bg-[#22C55E] rounded-full"></span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => {
              router.push('/admin/dashboard');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openInviteModal'));
              }, 100);
            }}
            className="rounded-xl p-6 text-center transition-all group"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Users className="w-8 h-8 text-[#22C55E] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Invite Members</p>
          </button>

          <button 
            className="rounded-xl p-6 text-center transition-all group"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <CreditCard className="w-8 h-8 text-[#22C55E] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Transactions</p>
          </button>

          <button 
            onClick={() => router.push('/admin/dashboard/members')}
            className="rounded-xl p-6 text-center transition-all group"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Users className="w-8 h-8 text-[#22C55E] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Manage Members</p>
          </button>

          <button 
            onClick={() => router.push('/admin/dashboard/settings')}
            className="rounded-xl p-6 text-center transition-all group"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Settings className="w-8 h-8 text-[#22C55E] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Settings</p>
          </button>
        </div>
      </div>

      {/* About This Chama */}
      <div className="rounded-2xl p-6 transition-colors" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Building2 className="w-5 h-5 text-[#22C55E]" />
          About This Chama
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-2 text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Created</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {new Date(chama.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Total Members</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{memberCount} members</p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Status</p>
            <p className="text-[#22C55E] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full"></span>
              Active
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Your Role</p>
            <p className="text-[#22C55E] font-semibold">Administrator</p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Monthly Growth Target</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{parseFloat(chama.monthly_growth_pct || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>Chama ID</p>
            <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{chama.id.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

    </div>
  );
}
