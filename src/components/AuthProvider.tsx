"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

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

  const fetchMemberData = async (userId: string) => {
    try {
      // 1. Find the active chama from cookies
      let activeChamaId: string | null = null;
      if (typeof document !== 'undefined') {
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
        console.error("Error fetching member:", memberError);
        setMember(null);
        setGroup(null);
        return;
      }
      
      let currentMembership = memberships.find(m => m.chama_id === activeChamaId);
      let finalGroupData = groupData;

      if (!currentMembership) {
        currentMembership = memberships[0];
        activeChamaId = currentMembership.chama_id;
        if (typeof document !== 'undefined') {
          document.cookie = `active_chama_id=${activeChamaId}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
        
        // If we didn't fetch the group because we didn't have activeChamaId, fetch it now
        if (!groupData) {
          const { data: fallbackGroup, error: fallbackError } = await supabase
            .from("chamas_v2")
            .select("*")
            .eq("id", activeChamaId)
            .single();
          if (!fallbackError) {
            finalGroupData = fallbackGroup;
          }
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

      if (finalGroupData) {
        setGroup(finalGroupData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchMemberData(session.user.id);
        }
        setIsLoading(false);
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
