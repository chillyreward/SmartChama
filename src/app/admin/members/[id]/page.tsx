"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminMemberDetailPage() {
  const { member: adminMember, group } = useAuth();
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  
  const [toastMsg, setToastMsg] = useState("");

  const formatCurrency = (val: number) => val.toLocaleString("en-KE", { maximumFractionDigits: 0 });

  const fetchData = async () => {
    if (!adminMember || !group || !id) return;
    try {
      setLoading(true);
      
      const { data: mData } = await supabase
        .from('chama_memberships')
        .select(`
          *,
          profile:profiles (
            full_name,
            phone_number,
            email
          )
        `)
        .eq('id', id)
        .single();
      
      setMember(mData);

      const { data: cData } = await supabase
        .from('contributions_v2')
        .select('*')
        .eq('membership_id', id)
        .order('created_at', { ascending: false });
      
      setContributions(cData || []);

      const { data: lData } = await supabase
        .from('loans_v2')
        .select('*')
        .eq('membership_id', id)
        .order('created_at', { ascending: false });

      setLoans(lData || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMember, group, id]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="h-48 card-bg border border-[var(--border)] rounded-2xl animate-pulse mb-6 shadow-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
          <div className="h-96 card-bg border border-[var(--border)] rounded-2xl animate-pulse shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center text-[var(--text-main)]">
        <h2 className="text-[22px] font-geist font-bold">Member not found</h2>
        <Link href="/admin/members" className="text-[#22C55E] dark:text-[#4ae176] mt-4 inline-block hover:underline font-semibold">
          ← Back to Members
        </Link>
      </div>
    );
  }

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const totalSaved = contributions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + Number(c.amount), 0);
  const totalLoaned = loans.reduce((sum, l) => sum + Number(l.amount), 0);
  const activeLoan = loans.find(l => l.status === 'active' || l.status === 'overdue');

  const roleColors: Record<string, string> = {
    'admin': 'bg-red-50 dark:bg-red-950/20 text-[#ba1a1a] dark:text-[#ffb4ab] border border-red-200 dark:border-red-900/30',
    'chairlady': 'bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] border border-[#edf6ea] dark:border-[#1a2a1a]',
    'treasurer': 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30',
    'secretary': 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900/30',
    'member': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
  };

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter relative text-[var(--text-main)]">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#161d16] dark:bg-[#E8F0E4] text-white dark:text-[#161d16] px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in-down">
          <span className="material-symbols-outlined text-[#22C55E]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/members" className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-[#1f2a1f] flex items-center justify-center transition-colors border border-[var(--border)] card-bg">
          <span className="material-symbols-outlined text-[var(--text-muted)]">arrow_back</span>
        </Link>
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Members</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Profile</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Member Profile</h1>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="card-bg border border-[var(--border)] border-t-2 border-t-[#22C55E] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-transparent text-[var(--brand-green)] flex items-center justify-center rounded-full text-2xl md:text-[32px] font-bold shadow-sm border border-[#22C55E]/20 shrink-0">
            {getInitials(member.profile?.full_name)}
          </div>
          <div>
            <h2 className="text-[20px] md:text-2xl font-bold font-geist text-[var(--text-main)] tracking-tight">{member.profile?.full_name || 'Unnamed Member'}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 md:mt-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold capitalize ${roleColors[member.role] || roleColors['member']}`}>
                {member.role || 'Member'}
              </span>
              <span className="text-sm text-[var(--text-muted)] flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[16px]">phone</span>
                {member.profile?.phone_number || 'No phone'}
              </span>
            </div>
            <div className="text-xs text-[#9CA3AF] dark:text-[#5a6e5a] mt-1 md:mt-2">
              Joined {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 bg-[#FAFAFA] dark:bg-[#0f1410] border border-[var(--border)] rounded-2xl p-3 md:p-4 text-center md:min-w-[130px] shadow-sm">
            <div className="text-[9px] md:text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">TRUST SCORE</div>
            <div className={`text-[20px] md:text-[28px] font-geist font-bold mt-1 ${member.trust_score >= 80 ? 'text-[var(--brand-green)]' : member.trust_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {member.trust_score || 0}
            </div>
          </div>
          <div className="flex-1 bg-[#FAFAFA] dark:bg-[#0f1410] border border-[var(--border)] rounded-2xl p-3 md:p-4 text-center md:min-w-[150px] shadow-sm">
            <div className="text-[9px] md:text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">TOTAL SAVED</div>
            <div className="text-[20px] md:text-[28px] font-geist font-bold mt-1 text-[var(--brand-green)] whitespace-nowrap">
              KSh {formatCurrency(totalSaved)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CONTRIBUTIONS HISTORY */}
        <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px] hover:shadow-md transition-all duration-200">
          <div className="p-4 md:p-6 border-b border-[var(--border)] flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold font-geist text-[var(--text-main)]">Contributions</h3>
            <span className="bg-transparent text-[var(--brand-green)] text-xs px-2.5 py-0.5 rounded font-bold">
              {contributions.length} Records
            </span>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">DATE</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">AMOUNT</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                {contributions.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-[var(--text-muted)] text-sm">No contributions found.</td></tr>
                ) : (
                  contributions.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-6 py-4 text-sm text-[var(--text-main)]">
                        {new Date(c.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--text-main)]">
                        KSh {formatCurrency(Number(c.amount))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                          c.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)]' :
                          c.status === 'late' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] overflow-y-auto flex-1">
            {contributions.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">No contributions found.</div>
            ) : (
              contributions.map(c => (
                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors">
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(c.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="font-mono font-bold text-sm text-[var(--text-main)] mt-0.5">
                      KSh {formatCurrency(Number(c.amount))}
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      c.status === 'confirmed' ? 'bg-transparent text-[var(--brand-green)]' :
                      c.status === 'late' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LOANS HISTORY */}
        <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px] hover:shadow-md transition-all duration-200">
          <div className="p-4 md:p-6 border-b border-[var(--border)] flex justify-between items-center shrink-0">
            <h3 className="text-lg font-bold font-geist text-[var(--text-main)]">Loans</h3>
            <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-900/30">
              {loans.length} Requests
            </span>
          </div>
          <div className="p-4 md:p-6 border-b border-[var(--border)] bg-[#FAFAFA] dark:bg-[#0f1410] shrink-0 flex justify-between items-center gap-4">
            <div>
              <div className="text-[9px] md:text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-1">CURRENT ACTIVE LOAN</div>
              {activeLoan ? (
                <div className="font-mono font-bold text-red-500 text-sm md:text-[18px]">KSh {formatCurrency(Number(activeLoan.amount))}</div>
              ) : (
                <div className="text-xs md:text-sm text-[#656864] dark:text-[#8FA88F] font-semibold">None</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[9px] md:text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase mb-1">TOTAL BORROWED ALL-TIME</div>
              <div className="font-mono font-bold text-[var(--text-main)] text-sm md:text-[18px] whitespace-nowrap">KSh {formatCurrency(totalLoaned)}</div>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">DATE</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">AMOUNT</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
                {loans.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-[var(--text-muted)] text-sm">No loans found.</td></tr>
                ) : (
                  loans.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors">
                      <td className="px-6 py-4 text-sm text-[var(--text-main)]">
                        {new Date(l.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[var(--text-main)]">
                        KSh {formatCurrency(Number(l.amount))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                          l.status === 'repaid' ? 'bg-transparent text-[var(--brand-green)]' :
                          l.status === 'active' ? 'bg-blue-55 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300' : 
                          l.status === 'overdue' ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-850 dark:text-orange-300'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] overflow-y-auto flex-1">
            {loans.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">No loans found.</div>
            ) : (
              loans.map(l => (
                <div key={l.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-colors">
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(l.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="font-mono font-bold text-sm text-[var(--text-main)] mt-0.5">
                      KSh {formatCurrency(Number(l.amount))}
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      l.status === 'repaid' ? 'bg-transparent text-[var(--brand-green)]' :
                      l.status === 'active' ? 'bg-blue-55 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300' : 
                      l.status === 'overdue' ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-850 dark:text-orange-300'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
