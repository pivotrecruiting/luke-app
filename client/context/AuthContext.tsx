import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { initializeRevenueCatForUser } from "@/services/revenuecat-service";
import { processPendingWorkshopCode } from "@/services/workshop-code-service";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastWorkshopCodeProcessUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        console.error("Failed to fetch session:", error);
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);

      const currentUserId = data.session?.user?.id ?? null;
      if (
        currentUserId &&
        lastWorkshopCodeProcessUserIdRef.current !== currentUserId
      ) {
        lastWorkshopCodeProcessUserIdRef.current = currentUserId;
        void initializeRevenueCatForUser(currentUserId).catch(
          (revenueCatError) => {
            console.error(
              "Failed to initialize RevenueCat after session restore:",
              revenueCatError,
            );
          },
        );
        void processPendingWorkshopCode().catch((workshopCodeError) => {
          console.error(
            "Failed to process pending workshop code after session restore:",
            workshopCodeError,
          );
        });
      }
    };

    initialize();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);

      const currentUserId = nextSession?.user?.id ?? null;
      if (!currentUserId) {
        lastWorkshopCodeProcessUserIdRef.current = null;
        return;
      }

      if (lastWorkshopCodeProcessUserIdRef.current === currentUserId) {
        return;
      }

      lastWorkshopCodeProcessUserIdRef.current = currentUserId;
      void initializeRevenueCatForUser(currentUserId).catch(
        (revenueCatError) => {
          console.error(
            "Failed to initialize RevenueCat after auth state change:",
            revenueCatError,
          );
        },
      );
      void processPendingWorkshopCode().catch((workshopCodeError) => {
        console.error(
          "Failed to process pending workshop code after auth state change:",
          workshopCodeError,
        );
      });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      isLoading,
    }),
    [session, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
