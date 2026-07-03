"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

type Member = any;
type Group = any;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  member: Member | null;
  group: Group | null;
  isLoading: boolean;
  refreshMemberData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  member: null,
  group: null,
  isLoading: true,
  refreshMemberData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchMemberData = async (userId: string) => {
    try {
      // 1. Find the active chama from sessionStorage, localStorage or cookies
      let activeChamaId: string | null = null;
      if (typeof window !== 'undefined') {
        activeChamaId = sessionStorage.getItem('active_chama_id') || localStorage.getItem('sc_last_chama_id');
      }
      if (!activeChamaId && typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )active_chama_id=([^;]+)'));
        if (match) activeChamaId = match[2];
      }

      // 2. Fetch memberships and active group data concurrently
      const membershipsPromise = supabase
        .from("chama_memberships")
        .select("*, profiles(*)")
        .eq("profile_id", userId)
        .eq("status", "active");

      const groupPromise = activeChamaId
        ? supabase.from("chamas_v2").select("*").eq("id", activeChamaId).single()
        : Promise.resolve({ data: null, error: null });

      const [
        { data: memberships, error: memberError },
        { data: groupData, error: groupError }
      ] = await Promise.all([membershipsPromise, groupPromise]);

      if (memberError || !memberships || memberships.length === 0) {

        // Retry once after 1s — RLS may not be ready on first page load after redirect
        if (!memberError) {
          await new Promise(r => setTimeout(r, 1000));
          const { data: retryMemberships } = await supabase
            .from("chama_memberships")
            .select("*, profiles(*)")
            .eq("profile_id", userId)
            .eq("status", "active");

          if (retryMemberships && retryMemberships.length > 0) {
            const m = retryMemberships[0];
            const cid = m.chama_id;
            if (typeof document !== 'undefined') {
              document.cookie = `active_chama_id=${cid}; path=/; max-age=${60 * 60 * 24 * 30}`;
            }
            const { data: g } = await supabase
              .from("chamas_v2").select("*").eq("id", cid).single();
            setMember({ ...m, user_id: m.profile_id, full_name: m.profiles?.full_name });
            setGroup(g);
            return;
          }
        }

        // Only sign out on real auth errors
        const isAuthError = memberError &&
          typeof memberError === 'object' &&
          'status' in memberError &&
          (memberError.status === 401 || memberError.code === 'PGRST301');

        if (isAuthError) {
          supabase.auth.signOut().catch(() => {});
          setSession(null);
          setUser(null);
        }

        setMember(null);
        setGroup(null);
        return;
      }
      
      let currentMembership = memberships.find(m => m.chama_id === activeChamaId);

      if (!currentMembership) {
        currentMembership = memberships[0];
        activeChamaId = currentMembership.chama_id;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('active_chama_id', activeChamaId);
          localStorage.setItem('sc_last_chama_id', activeChamaId);
        }
        if (typeof document !== 'undefined') {
          document.cookie = `active_chama_id=${activeChamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('active_chama_id', activeChamaId);
          localStorage.setItem('sc_last_chama_id', activeChamaId);
        }
        if (typeof document !== 'undefined') {
          document.cookie = `active_chama_id=${activeChamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
      }

      let finalGroupData = null;
      if (groupData && groupData.id === activeChamaId) {
        finalGroupData = groupData;
      } else if (activeChamaId) {
        const { data: fetchedGroup, error: fetchErr } = await supabase
          .from("chamas_v2")
          .select("*")
          .eq("id", activeChamaId)
          .single();
        if (!fetchErr) {
          finalGroupData = fetchedGroup;
        }
      }

      // Format for legacy compatibility in components
      const enrichedMember = {
        ...currentMembership,
        id: currentMembership.id,
        user_id: currentMembership.profile_id,
        full_name: currentMembership.profiles?.full_name
      };

      setMember(enrichedMember);
      setGroup(finalGroupData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session) {
            setSession(session);
            setUser(session.user);
            await fetchMemberData(session.user.id);
          } else {
            setSession(null);
            setUser(null);
            setMember(null);
            setGroup(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error in getInitialSession:", err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchMemberData(session.user.id);
          } else {
            setMember(null);
            setGroup(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Listen to path and cookie changes to sync member and group state
  useEffect(() => {
    let active = true;
    async function syncState() {
      if (session?.user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
        let activeChamaId: string | null = null;
        if (typeof window !== 'undefined') {
          activeChamaId = sessionStorage.getItem('active_chama_id') || localStorage.getItem('sc_last_chama_id');
        }
        if (!activeChamaId && typeof document !== 'undefined') {
          const match = document.cookie.match(new RegExp('(^| )active_chama_id=([^;]+)'));
          if (match) activeChamaId = match[2];
        }
        if (!group || group.id !== activeChamaId || !member) {
          if (active) {
            await fetchMemberData(session.user.id);
          }
        }
      }
    }
    syncState();
    return () => {
      active = false;
    };
  }, [pathname, session, group, member]);

  const refreshMemberData = async () => {
    if (user) {
      await fetchMemberData(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, member, group, isLoading, refreshMemberData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
