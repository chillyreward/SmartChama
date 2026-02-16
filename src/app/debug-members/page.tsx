"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugMembersPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const handleDebug = async () => {
    if (!adminEmail) {
      alert("Please enter admin email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/debug/members?adminEmail=${encodeURIComponent(adminEmail)}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Debug error:", error);
      alert("Error fetching debug data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Member Debug Tool</h1>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <label className="block text-white font-bold mb-2">Admin Email:</label>
          <div className="flex gap-4">
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
            <button
              onClick={handleDebug}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "Loading..." : "Debug"}
            </button>
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            {/* Admin Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Admin Info</h2>
              <pre className="text-emerald-400 text-sm overflow-auto">
                {JSON.stringify(data.admin, null, 2)}
              </pre>
            </div>

            {/* Chamas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Chamas ({data.chamas?.length || 0})
              </h2>
              <pre className="text-blue-400 text-sm overflow-auto">
                {JSON.stringify(data.chamas, null, 2)}
              </pre>
            </div>

            {/* Stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{data.stats?.totalMembers || 0}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">In Your Chamas</p>
                  <p className="text-2xl font-bold text-emerald-400">{data.stats?.chamaMembersCount || 0}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">Unassigned</p>
                  <p className="text-2xl font-bold text-amber-400">{data.stats?.unassignedCount || 0}</p>
                </div>
              </div>
            </div>

            {/* All Members */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                All Members ({data.allMembers?.length || 0})
              </h2>
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-2 text-slate-400">Name</th>
                      <th className="text-left p-2 text-slate-400">Email</th>
                      <th className="text-left p-2 text-slate-400">Chama ID</th>
                      <th className="text-left p-2 text-slate-400">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.allMembers?.map((member: any) => (
                      <tr key={member.id} className="border-b border-slate-800">
                        <td className="p-2 text-white">{member.full_name || member.name || 'N/A'}</td>
                        <td className="p-2 text-slate-400">{member.email}</td>
                        <td className="p-2">
                          {member.chama_id ? (
                            <span className="text-emerald-400">{member.chama_id.substring(0, 8)}...</span>
                          ) : (
                            <span className="text-amber-400">NULL</span>
                          )}
                        </td>
                        <td className="p-2 text-slate-400">
                          {new Date(member.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chama Members */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Members in Your Chamas ({data.chamaMembers?.length || 0})
              </h2>
              <pre className="text-emerald-400 text-sm overflow-auto max-h-96">
                {JSON.stringify(data.chamaMembers, null, 2)}
              </pre>
            </div>

            {/* Unassigned Members */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Unassigned Members ({data.unassignedMembers?.length || 0})
              </h2>
              <pre className="text-amber-400 text-sm overflow-auto max-h-96">
                {JSON.stringify(data.unassignedMembers, null, 2)}
              </pre>
            </div>

            {/* Errors */}
            {(data.errors?.allMembersError || data.errors?.chamaMembersError || data.errors?.unassignedError) && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-red-400 mb-4">Errors</h2>
                <pre className="text-red-400 text-sm overflow-auto">
                  {JSON.stringify(data.errors, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
