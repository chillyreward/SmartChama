"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Plus, Coins, TrendingUp, UserPlus, Grid3X3, Bell, Wallet, 
  ArrowUpRight, ShieldCheck, Users, X, Download, CreditCard,
  ChevronDown, Search
} from "lucide-react";

// --- CUSTOM CSS CHART COMPONENT (No Library Needed) ---
function NeonChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between h-32 mt-8 px-2 gap-2 w-full">
      {data.map((val, i) => (
        <div key={i} className="w-full h-full flex items-end relative group">
           {/* The Bar */}
           <div 
             style={{ height: `${(val / max) * 100}%` }} 
             className="w-full bg-emerald-500 rounded-t-sm opacity-60 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
           ></div>
           {/* Tooltip */}
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
             KES {val.toLocaleString()}
           </div>
        </div>
      ))}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Member";
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'deposit', 'loan', 'wallet'
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [balance, setBalance] = useState(0);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transactions...');
      
      // Fetch all transactions for balance calculation
      const allResponse = await fetch('/api/transactions?limit=1000');
      const allData = await allResponse.json();
      
      console.log('Transactions response:', allData);
      
      if (allData.success) {
        console.log(`Found ${allData.transactions.length} transactions`);
        
        // Calculate balance from all completed transactions
        const totalBalance = allData.transactions.reduce((sum: number, txn: any) => {
          if (txn.status !== 'completed') return sum;
          
          const amount = parseFloat(txn.amount) || 0;
          
          // Add deposits, dividends, and repayments
          if (txn.transaction_type === 'deposit' || txn.transaction_type === 'dividend' || txn.transaction_type === 'repayment') {
            return sum + amount;
          } 
          // Subtract withdrawals, loans, and penalties
          else if (txn.transaction_type === 'withdrawal' || txn.transaction_type === 'loan' || txn.transaction_type === 'penalty') {
            return sum - amount;
          }
          
          return sum;
        }, 0);
        
        console.log('Calculated balance:', totalBalance);
        setBalance(totalBalance);
        
        // Show only recent 10 transactions in the list
        setTransactions(allData.transactions.slice(0, 10));
      } else {
        console.error('Failed to fetch transactions:', allData.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setModalOpen(true);
    setAmount("");
    setPhoneNumber("");
    setStatusMessage("");
  };

  const handleDeposit = async () => {
    if (!amount || !phoneNumber) {
      setStatusMessage("Please enter both amount and phone number");
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^(254|0)\d{9}$/.test(cleanPhone)) {
      setStatusMessage("Invalid phone number. Use format: 254712345678 or 0712345678");
      return;
    }

    // Format phone number to 254 format
    const formattedPhone = cleanPhone.startsWith('0') 
      ? '254' + cleanPhone.slice(1) 
      : cleanPhone;

    setIsProcessing(true);
    setStatusMessage("Sending STK Push to your phone...");

    try {
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: parseFloat(amount),
          accountReference: 'SmartChama Deposit',
          transactionDesc: `Deposit to ${userName}'s account`
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage("✅ STK Push sent! Check your phone to complete payment.");
        setTimeout(() => {
          setModalOpen(false);
          // Refresh transactions after a delay to allow callback to process
          setTimeout(() => fetchTransactions(), 5000);
        }, 3000);
      } else {
        // Handle error object properly
        const errorMsg = typeof data.error === 'object' 
          ? JSON.stringify(data.error) 
          : data.error || 'Failed to send STK Push';
        console.error('STK Push Error:', data.error);
        setStatusMessage(`❌ Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Deposit error:', error);
      setStatusMessage("❌ Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestTransaction = async () => {
    setIsProcessing(true);
    setStatusMessage("Creating test transaction...");

    try {
      const response = await fetch('/api/test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount) || 1000,
          phoneNumber: phoneNumber || '254712345678'
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage("✅ Test transaction created! Refreshing...");
        setTimeout(() => {
          setModalOpen(false);
          fetchTransactions();
        }, 2000);
      } else {
        setStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Test transaction error:', error);
      setStatusMessage("❌ Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Overview
          </h2>
          <p className="text-slate-400 text-sm">Welcome back, <span className="text-emerald-400 font-bold">{userName}</span></p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/dashboard/chat" className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-slate-300 hover:text-white transition-colors group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold group-hover:text-emerald-400 transition-colors">AI Advisor Online</span>
          </Link>
          
          <div className="relative group cursor-pointer">
             <div className="size-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-slate-900 flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                {userName.charAt(0).toUpperCase()}
             </div>
             {/* Simple Dropdown for Profile */}
             <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto p-2 z-50">
                <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-800 mb-1">Signed in as {userName}</div>
                <Link href="/login" className="block px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg">Sign Out</Link>
             </div>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: BALANCE CARD --- */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-[32px] p-8 group transition-all duration-500 border border-white/5 bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-slate-900"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  My Wallet Balance
                </p>
                <h3 className="text-5xl lg:text-6xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                  <span className="text-2xl align-top opacity-50 mr-1">KES</span>
                  {loadingTransactions ? (
                    <span className="text-slate-600">...</span>
                  ) : (
                    balance.toLocaleString()
                  )}
                </h3>
              </div>
              <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> AES-256
              </div>
            </div>
            
            {/* THE CSS CHART */}
            <NeonChart data={[35000, 42000, 28000, 55000, 48000, 62000, 75000]} />
          </div>
        </div>

        {/* RIGHT COL: ACTIONS --- */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => openModal('deposit')} className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all group">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-bold text-white mt-4">Deposit</span>
          </button>
          
          <button onClick={() => openModal('loan')} className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex flex-col justify-between hover:border-amber-500/50 hover:bg-amber-950/10 transition-all group">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <span className="font-bold text-white mt-4">Borrow</span>
          </button>

          <button onClick={() => openModal('wallet')} className="col-span-2 bg-slate-900 border border-slate-800 rounded-[24px] p-6 flex items-center justify-between hover:bg-slate-800 transition-all group">
            <div className="flex items-center gap-4">
               <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Wallet className="w-5 h-5" />
               </div>
               <div className="text-left">
                 <span className="block font-bold text-white">My Wallet</span>
                 <span className="text-xs text-slate-500">Manage Cards & Banks</span>
               </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

       {/* --- TRANSACTIONS LIST --- */}
       <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-6 lg:p-8">
         <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             Recent Activity
             <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
           </h3>
           <button 
             onClick={() => alert("Downloading CSV...")}
             className="text-xs bg-slate-800 hover:bg-emerald-500 hover:text-black px-4 py-2 rounded-full text-white flex items-center gap-2 transition-all font-bold"
           >
             <Download className="w-3 h-3" /> Export Data
           </button>
         </div>
         
         <div className="space-y-3">
            {loadingTransactions ? (
              <div className="text-center py-8 text-slate-500">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No transactions yet. Make your first deposit!</div>
            ) : (
              transactions.map((txn) => {
                const isNegative = txn.transaction_type === 'penalty' || txn.transaction_type === 'withdrawal';
                const typeLabelMap: Record<string, string> = {
                  'deposit': 'Deposit',
                  'withdrawal': 'Withdrawal',
                  'loan': 'Loan Disbursed',
                  'repayment': 'Loan Repayment',
                  'penalty': 'Late Penalty',
                  'dividend': 'Dividend Payout'
                };
                const typeLabel = typeLabelMap[txn.transaction_type] || txn.transaction_type;

                const initials = txn.mpesa_receipt_number?.slice(0, 2) || 'TX';

                return (
                  <div key={txn.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-emerald-500/20 hover:bg-slate-900 transition-all cursor-pointer group">
                     <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                          {initials}
                        </div>
                        <div>
                           <p className="font-bold text-white text-sm">{typeLabel}</p>
                           <p className="text-[10px] text-slate-500 font-mono">
                             {txn.mpesa_receipt_number || `TXN-${txn.id.slice(0, 8)}`}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`font-bold text-sm ${isNegative ? "text-amber-500" : "text-emerald-400"}`}>
                          {isNegative ? "-" : "+"} KES {parseFloat(txn.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                     </div>
                  </div>
                );
              })
            )}
         </div>
       </div>

      {/* --- MODAL (The Popup) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[32px] p-6 relative shadow-2xl">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors">
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-8 text-center pt-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                {modalType === 'deposit' && <Plus className="w-8 h-8 text-emerald-500" />}
                {modalType === 'loan' && <Coins className="w-8 h-8 text-amber-500" />}
                {modalType === 'wallet' && <Wallet className="w-8 h-8 text-purple-500" />}
              </div>
              <h3 className="text-2xl font-black text-white capitalize tracking-tight">{modalType}</h3>
              <p className="text-slate-400 text-sm mt-2">
                {modalType === 'deposit' && "Funds will be deducted from your MPesa."}
                {modalType === 'loan' && "Interest rate: 1.2% per month."}
                {modalType === 'wallet' && "Manage your linked bank accounts."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (modalType === 'deposit') handleDeposit(); }}>
               {modalType === 'deposit' && (
                 <>
                   <div>
                     <label className="text-xs text-slate-400 font-bold uppercase ml-1">Phone Number</label>
                     <input 
                       type="tel" 
                       value={phoneNumber}
                       onChange={(e) => setPhoneNumber(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors" 
                       placeholder="254712345678" 
                       disabled={isProcessing}
                     />
                     <p className="text-[10px] text-slate-500 mt-1 ml-1">Format: 254712345678 or 0712345678</p>
                   </div>
                   <div>
                     <label className="text-xs text-slate-400 font-bold uppercase ml-1">Amount (KES)</label>
                     <input 
                       type="number" 
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors" 
                       placeholder="0.00" 
                       min="1"
                       disabled={isProcessing}
                     />
                   </div>
                 </>
               )}
               
               {modalType !== 'deposit' && (
                 <div>
                   <label className="text-xs text-slate-400 font-bold uppercase ml-1">Amount (KES)</label>
                   <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-emerald-500 transition-colors" placeholder="0.00" />
                 </div>
               )}

               {statusMessage && (
                 <div className={`p-3 rounded-lg text-sm text-center ${
                   statusMessage.includes('✅') 
                     ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                     : 'bg-red-500/10 text-red-400 border border-red-500/30'
                 }`}>
                   {statusMessage}
                 </div>
               )}
               
               <button 
                 type={modalType === 'deposit' ? 'submit' : 'button'}
                 onClick={modalType !== 'deposit' ? () => setModalOpen(false) : undefined}
                 disabled={isProcessing}
                 className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isProcessing ? 'Processing...' : `Confirm ${modalType}`}
               </button>

               {modalType === 'deposit' && (
                 <button 
                   type="button"
                   onClick={handleTestTransaction}
                   disabled={isProcessing}
                   className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                 >
                   🧪 Create Test Transaction (Skip M-Pesa)
                 </button>
               )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-emerald-500 p-10">Loading Command Center...</div>}>
      <DashboardContent />
    </Suspense>
  );
}