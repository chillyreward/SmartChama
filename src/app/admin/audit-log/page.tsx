"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AdminAuditLogPage() {
  const { member: adminMember, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!adminMember || !group) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // We use transactions table as a proxy for audit logs where recorded_by is set,
        // or any specific audit table if it existed.
        const { data, error } = await supabase
          .from('transactions')
          .select('*, members!transactions_recorded_by_fkey(full_name)')
          .eq('group_id', group.id)
          .not('recorded_by', 'is', null)
          .order('created_at', { ascending: false });
        
        // If the fkey alias fails, fallback to standard transactions. 
        // We'll just map it to look like an audit log.
        if (error) {
           const { data: fallbackData } = await supabase
            .from('transactions')
            .select('*')
            .eq('group_id', group.id)
            .not('recorded_by', 'is', null)
            .order('created_at', { ascending: false });
           
           // fetch member names manually for fallback
           if (fallbackData && fallbackData.length > 0) {
             const adminIds = Array.from(new Set(fallbackData.map(l => l.recorded_by)));
             const { data: admins } = await supabase.from('members').select('id, full_name').in('id', adminIds);
             
             const mapped = fallbackData.map(l => ({
               ...l,
               admin_name: admins?.find(a => a.id === l.recorded_by)?.full_name || 'Unknown Admin'
             }));
             setLogs(mapped);
           } else {
             setLogs([]);
           }
        } else {
          const mapped = data?.map(l => ({
            ...l,
            admin_name: l.members?.full_name || 'Unknown Admin'
          })) || [];
          setLogs(mapped);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminMember, group]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1280px] mx-auto w-full font-inter">
        <div className="card-bg border border-[var(--border)] rounded-2xl h-96 animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full font-inter min-h-full text-[var(--text-main)]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6 md:mb-8">
        <div>
          <p className="text-[12px] text-[#9CA3AF] dark:text-[#5a6e5a] font-medium mb-1 flex items-center gap-1">
            <span>Admin Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Audit Log</span>
          </p>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[var(--text-main)] tracking-tight leading-tight">Audit Log</h1>
          <p className="text-[14px] text-[var(--text-muted)] mt-1">Immutable record of all administrative actions</p>
        </div>
        <div className="w-full md:w-auto">
          <button className="bg-transparent border border-[var(--border)] text-[var(--text-main)] px-4 py-2.5 md:py-2 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#1f2a1f] transition-all shadow-sm flex items-center justify-center gap-2 w-full md:w-auto">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Log
          </button>
        </div>
      </div>

      <div className="bg-transparent border border-[var(--border)] rounded-2xl p-4 mb-6 flex items-start gap-3 text-[var(--text-muted)]">
        <span className="material-symbols-outlined text-[var(--text-muted)] shrink-0 mt-0.5">shield</span>
        <p className="text-xs leading-relaxed">
          For compliance and transparency, all actions taken by administrators, chairladies, and treasurers are logged here permanently. This log cannot be altered or deleted.
        </p>
      </div>

      <div className="card-bg border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden min-h-[400px] hover:shadow-md transition-all duration-200">
        <div className="overflow-x-auto">
          {/* Desktop Table View */}
          <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0f1410] border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">TIMESTAMP</th>
                <th className="px-6 py-4">ADMINISTRATOR</th>
                <th className="px-6 py-4">ACTION / TYPE</th>
                <th className="px-6 py-4">DETAILS & NOTES</th>
                <th className="px-6 py-4 text-right">REFERENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)] text-sm">
                    No admin actions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#1f2a1f] transition-colors">
                    <td className="px-6 py-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-[10px] shadow-sm">
                          {log.admin_name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-main)]">{log.admin_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[var(--text-muted)]">
                        {log.type?.replace('_', ' ') || 'SYSTEM ACTION'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-main)] max-w-md font-medium">
                      {log.notes ? (
                        <span className="text-[var(--text-muted)]">{log.notes}</span>
                      ) : (
                        <span>Recorded amount of <span className="font-mono font-bold">KSh {Math.abs(log.amount).toLocaleString()}</span></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-[var(--text-muted)]">
                      {log.reference || log.id.substring(0,8)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-[#f5f5f5] dark:divide-[#1f2a1f] p-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                No admin actions recorded yet.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-transparent text-[var(--brand-green)] text-[var(--brand-green)] flex items-center justify-center font-bold text-[10px] shadow-sm">
                        {log.admin_name.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-main)]">{log.admin_name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[var(--text-muted)]">
                      {log.type?.replace('_', ' ') || 'SYSTEM ACTION'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-[var(--text-main)] font-medium">
                    {log.notes ? (
                      <span className="text-[var(--text-muted)]">{log.notes}</span>
                    ) : (
                      <span>Recorded amount of <span className="font-mono font-bold">KSh {Math.abs(log.amount).toLocaleString()}</span></span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
                    <span>
                      {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-mono">
                      REF: {log.reference || log.id.substring(0,8)}
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
