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
        .from('members')
        .select('*')
        .eq('id', id)
        .single();
      
      setMember(mData);

      const { data: cData } = await supabase
        .from('contributions')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false });
      
      setContributions(cData || []);

      const { data: lData } = await supabase
        .from('loans')
        .select('*')
        .eq('member_id', id)
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
      <div className="p-8">
        <div className="h-48 bg-white border border-[#E5E7EB] rounded-lg animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>
          <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-sm font-geist text-on-surface">Member not found</h2>
        <Link href="/admin/members" className="text-primary mt-2 inline-block">← Back to Members</Link>
      </div>
    );
  }

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  const totalSaved = contributions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + Number(c.amount), 0);
  const totalLoaned = loans.reduce((sum, l) => sum + Number(l.amount), 0);
  const activeLoan = loans.find(l => l.status === 'active' || l.status === 'overdue');

  const roleColors: Record<string, string> = {
    'admin': 'bg-red-50 text-red-700 border-red-200',
    'chairlady': 'bg-[#22C55E]/10 text-[#005321] border-[#4ae176]',
    'treasurer': 'bg-blue-50 text-blue-700 border-blue-200',
    'secretary': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'member': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <div className="p-8 font-inter relative">
      {toastMsg && (
        <div className="fixed top-4 right-4 bg-[#22C55E] text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/members" className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-secondary">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Member Profile</h1>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#22C55E] text-white flex items-center justify-center rounded-full text-[32px] font-bold shadow-sm">
            {getInitials(member.full_name)}
          </div>
          <div>
            <h2 className="text-display-sm font-geist font-bold text-on-surface">{member.full_name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded text-label-caps font-bold border capitalize ${roleColors[member.role] || roleColors['member']}`}>
                {member.role}
              </span>
              <span className="text-body-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">phone</span>
                {member.phone_number || 'No phone'}
              </span>
            </div>
            <div className="text-body-sm text-secondary mt-1">
              Joined {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 text-center min-w-[120px]">
            <div className="text-label-caps text-secondary">TRUST SCORE</div>
            <div className={`text-headline-lg font-geist font-bold mt-1 ${member.trust_score >= 80 ? 'text-[#22C55E]' : member.trust_score >= 50 ? 'text-yellow-500' : 'text-error'}`}>
              {member.trust_score || 0}
            </div>
          </div>
          <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 text-center min-w-[120px]">
            <div className="text-label-caps text-secondary">TOTAL SAVED</div>
            <div className="text-headline-lg font-geist font-bold mt-1 text-[#22C55E]">
              KSh {formatCurrency(totalSaved)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CONTRIBUTIONS HISTORY */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center shrink-0">
            <h3 className="text-headline-sm font-geist text-on-surface">Contributions</h3>
            <span className="bg-[#22C55E]/10 text-[#005321] text-label-caps px-2 py-0.5 rounded font-bold">
              {contributions.length} Records
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">DATE</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">AMOUNT</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {contributions.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-secondary text-body-sm">No contributions found.</td></tr>
                ) : (
                  contributions.map(c => (
                    <tr key={c.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 text-body-sm text-on-surface">
                        {new Date(c.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-on-surface">
                        KSh {formatCurrency(Number(c.amount))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${
                          c.status === 'confirmed' ? 'bg-[#22C55E]/10 text-[#005321]' :
                          c.status === 'late' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'
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
        </div>

        {/* LOANS HISTORY */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center shrink-0">
            <h3 className="text-headline-sm font-geist text-on-surface">Loans</h3>
            <span className="bg-blue-50 text-blue-700 text-label-caps px-2 py-0.5 rounded font-bold border border-blue-200">
              {loans.length} Requests
            </span>
          </div>
          <div className="p-6 border-b border-[#E5E7EB] bg-surface-container-low shrink-0 flex justify-between items-center">
            <div>
              <div className="text-label-caps text-secondary mb-1">CURRENT ACTIVE LOAN</div>
              {activeLoan ? (
                <div className="font-mono font-bold text-on-surface text-[18px]">KSh {formatCurrency(Number(activeLoan.amount))}</div>
              ) : (
                <div className="text-body-sm text-secondary">None</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-label-caps text-secondary mb-1">TOTAL BORROWED ALL-TIME</div>
              <div className="font-mono font-bold text-on-surface text-[18px]">KSh {formatCurrency(totalLoaned)}</div>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">DATE</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium">AMOUNT</th>
                  <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-secondary text-body-sm">No loans found.</td></tr>
                ) : (
                  loans.map(l => (
                    <tr key={l.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 text-body-sm text-on-surface">
                        {new Date(l.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-on-surface">
                        KSh {formatCurrency(Number(l.amount))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-label-caps font-medium capitalize ${
                          l.status === 'repaid' ? 'bg-[#22C55E]/10 text-[#005321]' :
                          l.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                          l.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
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
        </div>

      </div>
    </div>
  );
}
