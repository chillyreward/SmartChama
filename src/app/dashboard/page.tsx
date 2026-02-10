"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard,
  FileText,
  Wallet as WalletIcon,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Building2,
  ArrowRight,
  Lightbulb,
  Coins,
  Sparkles,
  User,
  PieChart
} from "lucide-react";

interface AdminData {
  id: string;
  admin_user_id: string;
  full_name: string;
  chama_name: string;
  chama_id: string;
  phone_number: string;
  email: string;
  cycle_start_date: string;
  cycle_end_date: string;
  rules_text: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch admin data from chama_admins table
      const { data: adminInfo, error } = await supabase
        .from("chama_admins")
        .select("*")
        .eq("admin_user_id", user.id)
        .single();

      if (error || !adminInfo) {
        console.error("Error fetching admin data:", error);
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setAdminData(adminInfo);
    } catch (error) {
      console.error("Error checking user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES', 
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const recentActivities = [
    { type: "contribution", title: "Monthly Contribution", amount: 5000, date: "Nov 09, 03:42 AM", positive: true },
    { type: "loan", title: "Loan Disbursement", amount: -25000, date: "Nov 08, 11:23 PM", positive: false },
    { type: "interest", title: "Interest Applied", amount: 2140.50, date: "Nov 08, 09:15 PM", positive: true },
    { type: "contribution", title: "Monthly Contribution", amount: 5000, date: "Nov 07, 02:31 PM", positive: true },
  ];

  const topContributors = [
    { name: "David Kamau", amount: 60000, avatar: "DK", status: "Active Loan" },
    { name: "Sarah Wanjiku", amount: 45000, avatar: "SW", status: "Active Loan" },
    { name: "James Otieno", amount: 15000, avatar: "JO", status: "No Loan" },
  ];

  const stats = {
    totalMembers: 24,
    monthlyContributions: 120000,
    activeLoans: 8
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      {/* Top Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Overview</h2>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search transactions, members..."
                  className="w-80 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-white">
                <Bell className="w-6 h-6" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {adminData?.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-slate-400">Admin Access</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  {adminData?.full_name?.charAt(0) || "A"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {adminData?.full_name?.split(' ')[0] || "Admin"}!
            </h1>
            <p className="text-slate-400 mt-1">
              Here's what's happening with {adminData?.chama_name || "your chama"} today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-sm font-semibold">+12%</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stats.totalMembers}</h3>
              <p className="text-slate-400 text-sm">Total Members</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-amber-400 text-sm font-semibold">+8%</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">Ksh {stats.monthlyContributions.toLocaleString()}</h3>
              <p className="text-slate-400 text-sm">Monthly Contributions</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-semibold">{stats.activeLoans} active</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">Ksh 450,000</h3>
              <p className="text-slate-400 text-sm">Active Loans</p>
            </div>
          </div>

          {/* Balance & Goal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Balance Card */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-2">CHAMA TOTAL BALANCE</p>
                      <h1 className="text-5xl font-bold text-white mb-6">Ksh 1,450,230.00</h1>
                      
                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-emerald-100 text-xs mb-1">Monthly Growth</p>
                          <p className="text-white font-bold text-lg flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +12.4%
                          </p>
                        </div>
                        <div>
                          <p className="text-emerald-100 text-xs mb-1">This Month</p>
                          <p className="text-white font-bold text-lg">Ksh {stats.monthlyContributions.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Building2 className="w-12 h-12 text-white/30" />
                  </div>

                  <div className="flex gap-3">
                    <button className="px-6 py-2 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors">
                      Deposit
                    </button>
                    <button className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors border border-white/20">
                      Statement
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Goal Progress</h3>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Investment Fund</p>
                  <p className="text-amber-400 font-bold">75%</p>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-amber-400 to-amber-500"></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-500 text-xs">Current: Ksh 450,000</p>
                  <p className="text-slate-500 text-xs">Target: Ksh 600,000</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-amber-400 font-bold text-sm mb-1">STRATEGY TIP</p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Increase contributions by 15% next month to hit your goal 2 weeks earlier.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Top Contributors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Recent Activity</h3>
                <button className="text-emerald-400 text-sm font-medium hover:text-emerald-300 flex items-center gap-1">
                  View all history
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'contribution' ? 'bg-emerald-500/20' :
                        activity.type === 'loan' ? 'bg-red-500/20' :
                        'bg-amber-500/20'
                      }`}>
                        {activity.type === 'contribution' && <FileText className="w-5 h-5 text-emerald-400" />}
                        {activity.type === 'loan' && <Coins className="w-5 h-5 text-red-400" />}
                        {activity.type === 'interest' && <Sparkles className="w-5 h-5 text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{activity.title}</p>
                        <p className="text-slate-500 text-xs">{activity.date}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${activity.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activity.positive ? '+' : ''} {formatCurrency(activity.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Top Contributors</h3>
                <button className="text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {contributor.avatar}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{contributor.name}</p>
                        <p className="text-slate-500 text-xs">{contributor.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">Ksh {contributor.amount.toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">90.5%</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-semibold">Request Loan</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Join Venture</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chama Information Section */}
          {adminData && (
            <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4">Chama Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Chama Name</p>
                  <p className="text-white font-semibold">{adminData.chama_name}</p>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm mb-1">Chama ID</p>
                  <p className="text-white font-semibold">{adminData.chama_id}</p>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm mb-1">Cycle Start Date</p>
                  <p className="text-white font-semibold">{formatDate(adminData.cycle_start_date)}</p>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm mb-1">Cycle End Date</p>
                  <p className="text-white font-semibold">{formatDate(adminData.cycle_end_date)}</p>
                </div>
                
                {adminData.rules_text && (
                  <div className="md:col-span-2">
                    <p className="text-slate-400 text-sm mb-2">Rules & Guidelines</p>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{adminData.rules_text}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
  );
}
