"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Building2, Users, CreditCard, Settings, ShieldCheck,
  Loader2, CheckCircle, X, ArrowLeft, TrendingUp, Wallet
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
        <Loader2 className="w-8 h-8 text-[#006e2f] animate-spin" />
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary">Chama not found</p>
      </div>
    );
  }

  // PIN Verification Screen
  if (step !== 'content') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-4">
        <div className="bg-white border border-[#E5E7EB] w-full max-w-md rounded-[32px] p-8 text-center">
          
          {step === 'pin' && (
            <div>
              <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E5E7EB]">
                <ShieldCheck className="w-10 h-10 text-[#006e2f]" />
              </div>
              <h2 className="text-headline-sm font-geist font-bold text-on-surface mb-2">Verify Identity</h2>
              <p className="text-secondary text-sm mb-8">
                Enter your PIN to access <br />
                <span className="text-on-surface font-bold">{chama.name}</span>
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
                    className="w-12 h-14 bg-surface-container-lowest border border-[#E5E7EB] rounded-xl text-center text-headline-sm font-geist font-bold text-on-surface focus:border-[#006e2f] focus:shadow-sm outline-none transition-all"
                  />
                ))}
              </div>
              <p className="text-xs text-secondary mb-6">Enter any 4 digits (Demo Mode)</p>
              
              <button
                onClick={() => router.back()}
                className="text-secondary hover:text-on-surface text-sm flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Chamas
              </button>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-10">
              <Loader2 className="w-12 h-12 text-[#006e2f] animate-spin mx-auto mb-4" />
              <p className="text-on-surface font-bold">Verifying Credentials...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10">
              <CheckCircle className="w-16 h-16 text-[#006e2f] mx-auto mb-4 animate-bounce" />
              <p className="text-on-surface font-bold text-lg">Access Granted</p>
              <p className="text-[#006e2f] text-sm">Loading Chama Details...</p>
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
          className="w-10 h-10 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-center text-secondary hover:text-on-surface hover:border-[#006e2f] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-headline-lg font-geist font-bold text-on-surface flex items-center gap-3">
            {chama.name}
          </h1>
          <p className="text-secondary mt-1">Chama Overview & Management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#006e2f]" />
            </div>
            <p className="text-xs text-secondary uppercase font-bold">Total Balance</p>
          </div>
          <p className="text-3xl font-bold text-on-surface mb-1">
            KES {parseFloat(chama.total_balance || 0).toLocaleString()}
          </p>
          <p className="text-xs text-[#006e2f]">+0% this month</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#006e2f]" />
            </div>
            <p className="text-xs text-secondary uppercase font-bold">Investment Goal</p>
          </div>
          <p className="text-3xl font-bold text-on-surface mb-1">
            KES {parseFloat(chama.investment_goal || 0).toLocaleString()}
          </p>
          <p className="text-xs text-secondary">Target amount</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#006e2f]" />
            </div>
            <p className="text-xs text-secondary uppercase font-bold">Members</p>
          </div>
          <p className="text-3xl font-bold text-on-surface mb-1">
            {memberCount}
          </p>
          <p className="text-xs text-secondary">Active members</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-on-surface font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#006e2f] rounded-full"></span>
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
            className="bg-white border border-[#E5E7EB] hover:border-[#006e2f] rounded-xl p-6 text-center transition-all group"
          >
            <Users className="w-8 h-8 text-[#006e2f] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-on-surface">Invite Members</p>
          </button>

          <button className="bg-white border border-[#E5E7EB] hover:border-[#006e2f] rounded-xl p-6 text-center transition-all group">
            <CreditCard className="w-8 h-8 text-[#006e2f] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-on-surface">Transactions</p>
          </button>

          <button 
            onClick={() => router.push('/admin/dashboard/members')}
            className="bg-white border border-[#E5E7EB] hover:border-blue-500 rounded-xl p-6 text-center transition-all group"
          >
            <Users className="w-8 h-8 text-[#006e2f] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-on-surface">Manage Members</p>
          </button>

          <button 
            onClick={() => router.push('/admin/dashboard/settings')}
            className="bg-white border border-[#E5E7EB] hover:border-purple-500 rounded-xl p-6 text-center transition-all group"
          >
            <Settings className="w-8 h-8 text-[#006e2f] mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-on-surface">Settings</p>
          </button>
        </div>
      </div>

      {/* About This Chama */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
        <h3 className="text-on-surface font-bold mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#006e2f]" />
          About This Chama
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-secondary mb-2">Created</p>
            <p className="text-on-surface font-semibold">
              {new Date(chama.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <p className="text-secondary mb-2">Total Members</p>
            <p className="text-on-surface font-semibold">{memberCount} members</p>
          </div>
          <div>
            <p className="text-secondary mb-2">Status</p>
            <p className="text-[#006e2f] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-[#006e2f] rounded-full"></span>
              Active
            </p>
          </div>
          <div>
            <p className="text-secondary mb-2">Your Role</p>
            <p className="text-[#006e2f] font-semibold">Administrator</p>
          </div>
          <div>
            <p className="text-secondary mb-2">Monthly Growth Target</p>
            <p className="text-on-surface font-semibold">{parseFloat(chama.monthly_growth_pct || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-secondary mb-2">Chama ID</p>
            <p className="text-on-surface font-mono text-xs">{chama.id.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
        <h3 className="text-on-surface font-bold mb-4 flex items-center gap-2">
          Next Steps
        </h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-surface-container-low rounded-full flex items-center justify-center flex-shrink-0 text-[#006e2f] font-bold text-xs">1</span>
            <div>
              <p className="text-on-surface font-semibold">Invite your first members</p>
              <p className="text-secondary text-xs">Click "Invite Members" to generate invite links</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-surface-container-low rounded-full flex items-center justify-center flex-shrink-0 text-[#006e2f] font-bold text-xs">2</span>
            <div>
              <p className="text-on-surface font-semibold">Set up contribution rules</p>
              <p className="text-secondary text-xs">Define monthly contribution amounts and schedules</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-surface-container-low rounded-full flex items-center justify-center flex-shrink-0 text-[#006e2f] font-bold text-xs">3</span>
            <div>
              <p className="text-on-surface font-semibold">Start collecting contributions</p>
              <p className="text-secondary text-xs">Members can deposit via M-Pesa once they join</p>
            </div>
          </li>
        </ul>
      </div>

    </div>
  );
}
