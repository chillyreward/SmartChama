// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  Sparkles, 
  Menu,
  X
} from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SmartChama - Group Savings",
  description: "Modern Fintech for Chamas",
};

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Savings", href: "/savings", icon: PiggyBank },
  { name: "Loans", href: "/loans", icon: Wallet },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "AI Advisor", href: "/ai-advisor", icon: Sparkles },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        <div className="flex min-h-screen">
          {/* Desktop Sidebar - Fixed Left */}
          <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-xl z-50">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
              <div className="bg-emerald-500 size-10 rounded-xl flex items-center justify-center">
                <Wallet className="text-slate-950 w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-white text-lg font-bold leading-tight">SmartChama</h1>
                <p className="text-slate-400 text-xs font-medium">Wealth Management</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <item.icon className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 space-y-3">
              <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-colors">
                <span className="text-sm">Add Member</span>
              </button>
              
              <div className="border-t border-slate-800 pt-4 space-y-1">
                <button className="flex w-full items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
                  <span className="text-sm font-medium">Help Center</span>
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-300 transition-colors">
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
            {/* Mobile Header */}
            <header className="lg:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 size-8 rounded-lg flex items-center justify-center">
                    <Wallet className="text-slate-950 w-5 h-5" />
                  </div>
                  <span className="font-bold text-lg">SmartChama</span>
                </div>
                <button className="p-2 text-slate-400">
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </header>

            {/* Page Content */}
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/50 z-50">
            <div className="flex items-center justify-around py-2 px-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
            {/* Safe area padding for iPhone */}
            <div className="h-safe-area-inset-bottom bg-slate-950" />
          </nav>
        </div>
      </body>
    </html>
  );
}