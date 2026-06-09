"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";

interface AppContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dashboardData: any | null;
  challenges: any[];
  activeChallenges: any[];
  events: any[];
  leaderboard: any[];
  recommendations: any[];
  loading: boolean;
  setUser: (user: any) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<string>("dashboard");
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    // Auto-refresh relevant data when tabs change
    refreshData();
  };

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
  }, []);

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
      if (err instanceof Error && err.message.toLowerCase().includes("credentials")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // Fetch initial profile if token is set
  useEffect(() => {
    if (token) {
      setLoading(true);
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
      }}
    >
      {children}
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
