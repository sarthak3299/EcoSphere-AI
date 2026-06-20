"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/services/api";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export interface UserType {
  id: number;
  name: string;
  email: string;
  eco_score: number;
  level: number;
  xp: number;
  profile_image?: string | null;
  created_at: string;
}

interface AppContextType {
  user: UserType | null;
  token: string | null;
  isAuthenticated: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dashboardData: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenges: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeChallenges: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leaderboard: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendations: any[];
  loading: boolean;
  setUser: (user: UserType | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  });
  const [activeTab, setActiveTabState] = useState<string>("dashboard");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [challenges, setChallenges] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" | "info" | "warning" }>>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("token");
    }
    return true;
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    // Auto-refresh relevant data when tabs change
    refreshData();
  };

  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setToken(null);
    setUser(null);
    setDashboardData(null);
    setChallenges([]);
    setActiveChallenges([]);
    setEvents([]);
    setLeaderboard([]);
    setRecommendations([]);
    setActiveTabState("dashboard");
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch user profile
      const userProfile = await api.auth.getMe();
      setUser(userProfile);

      // Fetch dashboard metrics
      const dash = await api.carbon.getDashboard();
      setDashboardData(dash);

      // Fetch leaderboard
      const lead = await api.gamification.getLeaderboard();
      setLeaderboard(lead);

      // Fetch challenges
      const chal = await api.gamification.getChallenges();
      setChallenges(chal);

      // Fetch active user challenges
      const activeChal = await api.gamification.getActiveChallenges();
      setActiveChallenges(activeChal);

      // Fetch events
      const ev = await api.events.getAll();
      setEvents(ev);

      // Fetch recommendations
      try {
        const recs = await api.ai.getRecommendations();
        setRecommendations(recs);
      } catch (err) {
        console.warn("Failed to load AI recommendations:", err);
      }
    } catch (err) {
      console.error("Error refreshing application data:", err);
      // If unauthorized token, force logout
      if (
        (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
        (err instanceof Error && err.message.toLowerCase().includes("credentials"))
      ) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // Fetch initial profile if token is set
  useEffect(() => {
    if (token) {
      refreshData();
    }
  }, [token, refreshData]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await api.auth.login(email, password);
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await api.auth.signup(name, email, password);
      // Auto-login after signup
      await login(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const isAuthenticated = !!token;

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        activeTab,
        setActiveTab,
        dashboardData,
        challenges,
        activeChallenges,
        events,
        leaderboard,
        recommendations,
        loading,
        setUser,
        login,
        signup,
        logout,
        refreshData,
        showToast,
      }}
    >
      {children}
      {/* Premium Toast Notification System */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => {
          const Icon = 
            toast.type === "success" ? CheckCircle :
            toast.type === "error" ? AlertCircle :
            toast.type === "warning" ? AlertTriangle :
            Info;
          const bgStyle = 
            toast.type === "success" ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" :
            toast.type === "error" ? "bg-rose-950/90 border-rose-500/50 text-rose-200" :
            toast.type === "warning" ? "bg-amber-950/90 border-amber-500/50 text-amber-200" :
            "bg-slate-950/90 border-slate-700/50 text-slate-200";
          return (
            <div 
              key={toast.id} 
              className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-slide-in ${bgStyle}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-xs font-bold leading-normal">{toast.message}</div>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-white transition shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

