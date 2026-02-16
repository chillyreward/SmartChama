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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!chama) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Chama not found</p>
      </div>
    );
  }

  // PIN Verification Screen
  if (step !== 'content') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[32px] p-8 text-center">
          
          {step === 'pin' && (
            <div>
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <ShieldCheck className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify Identity</h2>
              <p className="text-slate-400 text-sm mb-8">
                Enter your PIN to access <br />
                <span className="text-white font-bold">{chama.name}</span>
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
                    className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-xl text-center text-2xl font-bold text-white focus:border-amber-500 focus:shadow-[0_0_20px_rgba(251,191,36,0.3)] outline-none transition-all"
                  />
                ))}
              </div>
              <p className="text-xs text-slate-600 mb-6">Enter any 4 digits (Demo Mode)</p>
              
              <button
                onClick={() => router.back()}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Chamas
              </button>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-10">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
              <p className="text-white font-bold">Verifying Credentials...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10">
              <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-bounce" />
              <p className="text-white font-bold text-lg">Access Granted</p>
              <p className="text-amber-400 text-sm">Loading Chama Details...</p>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Main Content Screen
  return (
    <div className="space-y-8 pb-20">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-500 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            {chama.name}
          </h1>
          <p className="text-slate-400 mt-1">Chama Overview & Management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 uppercase font-bold">Total Balance</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            KES {parseFloat(chama.total_balance || 0).toLocaleString()}
          </p>
          <p className="text-xs text-emerald-400">+0% this month</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500 uppercase font-bold">Investment Goal</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            KES {parseFloat(chama.investment_goal || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">Target amount</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-slate-500 uppercase font-bold">Members</p>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {memberCount}
          </p>
          <p className="text-xs text-slate-400">Active members</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
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
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl p-6 text-center transition-all group"
          >
            <Users className="w-8 h-8 text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white">Invite Members</p>
          </button>

          <button className="bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-xl p-6 text-center transition-all group">
            <CreditCard className="w-8 h-8 text-amber-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white">Transactions</p>
          </button>

          <button 
            onClick={() => router.push('/admin/dashboard/members')}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-xl p-6 text-center transition-all group"
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white">Manage Members</p>
          </button>

          <button 
            onClick={() => router.push('/admin/dashboard/settings')}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500 rounded-xl p-6 text-center transition-all group"
          >
            <Settings className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-bold text-white">Settings</p>
          </button>
        </div>
      </div>

      {/* About This Chama */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          About This Chama
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-slate-500 mb-2">Created</p>
            <p className="text-white font-semibold">
              {new Date(chama.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Total Members</p>
            <p className="text-white font-semibold">{memberCount} members</p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Status</p>
            <p className="text-emerald-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Active
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Your Role</p>
            <p className="text-amber-400 font-semibold">Administrator</p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Monthly Growth Target</p>
            <p className="text-white font-semibold">{parseFloat(chama.monthly_growth_pct || 0).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-slate-500 mb-2">Chama ID</p>
            <p className="text-white font-mono text-xs">{chama.id.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          🚀 Next Steps
        </h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">1</span>
            <div>
              <p className="text-white font-semibold">Invite your first members</p>
              <p className="text-slate-400 text-xs">Click "Invite Members" to generate invite links</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">2</span>
            <div>
              <p className="text-white font-semibold">Set up contribution rules</p>
              <p className="text-slate-400 text-xs">Define monthly contribution amounts and schedules</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-xs">3</span>
            <div>
              <p className="text-white font-semibold">Start collecting contributions</p>
              <p className="text-slate-400 text-xs">Members can deposit via M-Pesa once they join</p>
            </div>
          </li>
        </ul>
      </div>

    </div>
  );
}
