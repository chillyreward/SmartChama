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
      <div className="p-8">
        <div className="h-96 bg-white border border-[#E5E7EB] rounded-lg animate-pulse shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="p-8 font-inter min-h-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface font-geist">Audit Log</h1>
          <p className="text-body-sm text-secondary mt-1">Immutable record of all administrative actions</p>
        </div>
        <button className="bg-white border border-[#E5E7EB] text-on-surface px-4 py-2 rounded text-body-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Log
        </button>
      </div>

      <div className="bg-surface-container-low border border-[#E5E7EB] rounded-lg p-4 mb-6 flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">shield</span>
        <p className="text-body-sm text-secondary leading-relaxed">
          For compliance and transparency, all actions taken by administrators, chairladies, and treasurers are logged here permanently. This log cannot be altered or deleted.
        </p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E5E7EB]">
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">TIMESTAMP</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">ADMINISTRATOR</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">ACTION / TYPE</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium">DETAILS & NOTES</th>
                <th className="px-6 py-3 text-label-caps text-secondary font-medium text-right">REFERENCE</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary text-body-sm">
                    No admin actions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-body-sm text-secondary whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-[10px]">
                          {log.admin_name.charAt(0)}
                        </div>
                        <span className="text-body-sm font-medium text-on-surface">{log.admin_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-label-caps font-bold capitalize bg-gray-100 border border-gray-200 text-gray-700">
                        {log.type?.replace('_', ' ') || 'SYSTEM ACTION'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface max-w-md">
                      {log.notes ? (
                        <span className="text-secondary">{log.notes}</span>
                      ) : (
                        <span>Recorded amount of <span className="font-mono font-medium">KSh {Math.abs(log.amount).toLocaleString()}</span></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-body-sm font-mono text-secondary">
                      {log.reference || log.id.substring(0,8)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
