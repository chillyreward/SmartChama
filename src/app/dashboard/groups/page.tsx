"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  ArrowRightLeft,
  Search,
  X
} from "lucide-react";

interface Chama {
  id: string;
  name: string;
  total_balance: number;
  monthly_growth_pct: number;
  investment_goal: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function GroupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myGroups, setMyGroups] = useState<Chama[]>([]);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  
  // Form states
  const [chamaName, setChamaName] = useState("");
  const [investmentGoal, setInvestmentGoal] = useState("");

  // Fetch chamas on component mount
  useEffect(() => {
    fetchChamas();
  }, []);

  const fetchChamas = async () => {
    try {
      setFetchingGroups(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No user found");
        return;
      }

      // Fetch chamas created by the user
      const { data, error: fetchError } = await supabase
        .from('chamas')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("Error fetching chamas:", fetchError);
        return;
      }

      setMyGroups(data || []);
      console.log("✅ Fetched chamas:", data);
    } catch (err) {
      console.error("❌ Error in fetchChamas:", err);
    } finally {
      setFetchingGroups(false);
    }
  };

  const handleCreateChama = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to create a chama");
        setLoading(false);
        return;
      }

      // Insert new chama
      const { data, error: insertError } = await supabase
        .from('chamas')
        .insert([
          {
            name: chamaName,
            investment_goal: investmentGoal ? parseFloat(investmentGoal) : null,
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("✅ Chama created successfully:", data);
      
      // Reset form and close modal
      setChamaName("");
      setInvestmentGoal("");
      setShowCreateModal(false);
      
      // Show success message
      alert("Chama created successfully!");
      
      // Refresh the chamas list
      fetchChamas();
    } catch (err: any) {
      console.error("❌ Error creating chama:", err);
      setError(err.message || "Failed to create chama. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search groups..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Dashboard</span>
          <span className="text-emerald-400 font-bold text-sm">My Groups</span>
          <span className="text-sm text-slate-400">Transactions</span>
          <span className="text-sm text-slate-400">Settings</span>
          <div className="size-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 ml-4" />
        </div>
      </header>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">My Groups</h1>
          <p className="text-slate-400 mt-2">Manage and switch between your active group savings accounts</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-full transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Chama</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fetchingGroups ? (
          // Loading state
          <div className="col-span-full text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading your chamas...</p>
          </div>
        ) : myGroups.length === 0 ? (
          // Empty state
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No Chamas Yet</h3>
            <p className="text-slate-400 mb-4">Create your first chama to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-6 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Chama
            </button>
          </div>
        ) : (
          // Chamas list
          myGroups.map((group, index) => {
            const colors = [
              "from-emerald-600 to-emerald-800",
              "from-amber-600 to-amber-800",
              "from-blue-600 to-blue-800",
              "from-orange-400 to-pink-600",
              "from-purple-600 to-purple-800",
              "from-red-600 to-red-800"
            ];
            const color = colors[index % colors.length];
            
            return (
              <div key={group.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group">
                <div className={`h-32 bg-gradient-to-br ${color} relative p-4`}>
                  <span className="absolute top-3 right-3 bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                    ADMIN
                  </span>
                  <div className="absolute bottom-3 left-4">
                    <p className="text-white/80 text-xs">Balance</p>
                    <p className="text-white font-bold text-lg">KES {group.total_balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{group.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-sm">ID: {group.id.slice(0, 8)}</span>
                    <span className="text-emerald-400 text-sm font-medium">Admin</span>
                  </div>
                  {group.investment_goal && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Goal Progress</span>
                        <span>{Math.round((group.total_balance / group.investment_goal) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.min((group.total_balance / group.investment_goal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
                    <ArrowRightLeft className="w-4 h-4" />
                    Switch to this Chama
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8">
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-full shadow-lg shadow-emerald-500/20 transition-colors">
          <Plus className="w-5 h-5" />
          Join a Chama
        </button>
      </div>

      {/* Pro Plan Card */}
      <div className="fixed bottom-24 lg:bottom-8 left-4 lg:left-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 max-w-xs">
        <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Pro Plan</p>
        <p className="text-slate-400 text-xs mb-3">Manage up to 10 Chamas effortlessly.</p>
        <button className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-2 rounded-lg text-sm transition-colors">
          Upgrade Now
        </button>
      </div>

      {/* Create Chama Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Create New Chama</h2>
              <p className="text-slate-400 text-sm">Start a new savings group</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateChama} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chama Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={chamaName}
                  onChange={(e) => setChamaName(e.target.value)}
                  placeholder="e.g., Family Savings"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Investment Goal (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">KES</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={investmentGoal}
                    onChange={(e) => setInvestmentGoal(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-16 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Set a target amount for your group</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Chama"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}