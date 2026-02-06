import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-4">
        <h1 className="font-bold mb-6">SmartChama</h1>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block text-slate-400 hover:text-white">Overview</Link>
          <Link href="/dashboard/savings" className="block text-slate-400 hover:text-white">Savings</Link>
          <Link href="/dashboard/chat" className="block text-slate-400 hover:text-white">AI Chat</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}