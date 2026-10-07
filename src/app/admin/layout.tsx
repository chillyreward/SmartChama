'use client';

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MobileHeader from "@/components/MobileHeader";
import { MobileAdminTabBar } from "@/components/MobileAdminTabBar";
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, member, group, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.push("/login");
        return;
      }
      const adminRoles = ["admin", "chairlady", "treasurer", "secretary"];
      const isAdmin = member && adminRoles.includes(member.role);
      if (!isAdmin || !group) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, session, member, group, router]);

  const adminRoles = ["admin", "chairlady", "treasurer", "secretary"];
  const isAdmin = member && adminRoles.includes(member.role);

  if (isLoading || !member || !group || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center page-bg">
        <div className="w-12 h-12 border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden page-bg font-inter text-[var(--text-main)]">
      
      {/* ONE sidebar, desktop only */}
      <div className="hidden lg:flex flex-col flex-shrink-0 w-64">
        <Sidebar variant="admin" />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* MOBILE HEADER (Only visible on mobile/tablet) */}
        <div className="lg:hidden flex-shrink-0">
          <MobileHeader isAdmin={true} />
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 pt-16 lg:pt-6">
          {children}
        </main>

        {/* MOBILE BOTTOM TAB BAR (Only visible on mobile/tablet) */}
        <div className="lg:hidden">
          <MobileAdminTabBar />
        </div>

      </div>
    </div>
  );
}
