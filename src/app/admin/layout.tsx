'use client';

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppFrame, FullScreenLoader } from '@/components/shell/AppFrame';
import KycBanner from "@/components/KycBanner";

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
    return <FullScreenLoader />;
  }

  return (
    <AppFrame variant="admin" banner={<KycBanner creatorId={(group as any)?.created_by} />}>
      {children}
    </AppFrame>
  );
}
