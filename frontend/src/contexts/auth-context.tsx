"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, signOut as firebaseSignOut, type UserProfile } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  freeUsesRemaining: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't set up auth listener if Firebase isn't initialized
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setProfile(docSnapshot.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isPremium: profile?.plan === "premium",
    freeUsesRemaining: profile?.freeUsesRemaining ?? 3,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
