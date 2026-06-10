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
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (memberError || !memberData) {
        console.error("Error fetching member:", memberError);
        setMember(null);
        setGroup(null);
        return;
      }

      setMember(memberData);

      if (memberData.chama_id || memberData.group_id) {
        const targetId = memberData.chama_id || memberData.group_id;
        const { data: groupData, error: groupError } = await supabase
          .from("chamas")
          .select("*")
          .eq("id", targetId)
          .single();

        if (!groupError && groupData) {
          setGroup(groupData);
        }
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
