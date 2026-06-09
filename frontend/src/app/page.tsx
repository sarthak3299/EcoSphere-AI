"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import Sidebar from "@/components/Sidebar";

// Sub-views dynamic loading
import DashboardView from "@/components/views/DashboardView";
import TrackerView from "@/components/views/TrackerView";
import SimulatorView from "@/components/views/SimulatorView";
import RecommendationsView from "@/components/views/RecommendationsView";
import ReportsView from "@/components/views/ReportsView";
import HeatmapView from "@/components/views/HeatmapView";
import ChallengesView from "@/components/views/ChallengesView";
import EventsView from "@/components/views/EventsView";
import GamesView from "@/components/views/GamesView";
import CommunityView from "@/components/views/CommunityView";
import LearningHubView from "@/components/views/LearningHubView";
import ProfileView from "@/components/views/ProfileView";
import SettingsView from "@/components/views/SettingsView";
import ChatbotView from "@/components/views/ChatbotView";

import { 
  Search, 
  Bell, 
  Leaf, 
  Sparkles,
  Loader2,
  Lock,
  Mail,
  User,
  MessageSquare,
  Check,
  Trash2,
  Inbox,
  X
} from "lucide-react";

export default function Home() {
  const { 
    isAuthenticated, 
    loading, 
    activeTab, 
    setActiveTab, 
    user, 
    login, 
    signup 
  } = useApp();

  const [isSignup, setIsSignup] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Notifications state
  interface NotificationItem {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: "info" | "success" | "warning";
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Garbage Report Verified",
      description: "Municipal authority has assigned a team to resolve the garbage pile near Sector 5.",
      time: "2 hours ago",
      read: false,
      type: "success"
    },
    {
      id: "2",
      title: "New Eco Challenge",
      description: "Join the 'No Plastic' challenge and earn 150 Eco Points.",
      time: "1 day ago",
      read: false,
      type: "info"
    },
    {
      id: "3",
      title: "Simulator Alert",
      description: "Your simulated carbon reduction is 15% higher than your actual track this week.",
      time: "2 days ago",
      read: true,
      type: "warning"
    }
  ]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const hasUnread = notifications.some(n => !n.read);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (isSignup) {
        await signup(authName, authEmail, authPassword);
      } else {
        await login(authEmail, authPassword);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Render Loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-emerald-400">
        <div className="relative flex items-center justify-center">
          <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-emerald-400 opacity-20" />
          <Leaf className="w-10 h-10 animate-bounce text-emerald-500" />
        </div>
        <span className="text-xs font-black tracking-widest uppercase mt-4 text-emerald-300">
          Syncing EcoSphere...
        </span>
      </div>
    );
  }

  // Render Portal View (Authenticated)
  if (isAuthenticated) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#f4f7f5] text-slate-900">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Right Application Body */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
            {/* Search Input */}
            <div className="relative w-72 hidden sm:block">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search metrics, reports, campaigns..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-10 pr-4 outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Score Badges & Icons */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Eco Score badge */}
              <div 
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200/50 bg-emerald-50 text-emerald-700 font-extrabold text-xs cursor-pointer hover:bg-emerald-100/50 transition"
              >
                <Leaf className="w-3.5 h-3.5" fill="currentColor" />
                <span>{user?.eco_score || 748}</span>
                <span className="text-[10px] text-slate-400 font-normal">Eco Score</span>
              </div>

              {/* Chat Redirect Icon */}
              <button 
                onClick={() => setActiveTab("chatbot")}
                title="AI Assistant"
                className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-slate-50 rounded-xl relative transition"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="Notifications"
                  className={`p-2 rounded-xl relative transition ${
                    notificationsOpen 
                      ? "text-emerald-700 bg-emerald-50" 
                      : "text-slate-400 hover:text-emerald-700 hover:bg-slate-50"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full border border-white" />
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setNotificationsOpen(false)} 
                    />
                    {/* Dropdown Card */}
                    <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 py-3 z-40 animate-fade-in text-xs">
                      {/* Header */}
                      <div className="px-4 pb-2 border-b border-slate-50 flex items-center justify-between font-bold text-slate-800">
                        <span>Notifications</span>
                        <div className="flex gap-2.5">
                          {notifications.length > 0 && (
                            <>
                              <button 
                                onClick={handleMarkAllRead}
                                className="text-emerald-600 hover:underline text-[10px]"
                              >
                                Mark all read
                              </button>
                              <span className="text-slate-200">|</span>
                              <button 
                                onClick={handleClearAll}
                                className="text-rose-600 hover:underline text-[10px]"
                              >
                                Clear all
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Notification list */}
                      <div className="max-h-64 overflow-y-auto mt-2">
                        {notifications.length === 0 ? (
                          <div className="py-6 px-4 flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
                            <Inbox className="w-8 h-8 text-slate-300" />
                            <p className="font-bold text-[11px]">All caught up!</p>
                            <p className="text-[10px] text-slate-400 font-medium">No new notifications at this time.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`px-4 py-2.5 hover:bg-slate-50 flex gap-3 transition relative group ${
                                !notif.read ? "bg-emerald-500/[0.02] border-l-2 border-emerald-500" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 justify-between">
                                  <span className={`font-extrabold ${!notif.read ? "text-slate-800" : "text-slate-500"}`}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                                    {notif.time}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5 font-medium">
                                  {notif.description}
                                </p>
                                
                                {/* Mark Read/Trash action buttons */}
                                <div className="flex gap-2 mt-1">
                                  {!notif.read && (
                                    <button
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="text-emerald-600 hover:text-emerald-700 text-[9px] font-bold flex items-center gap-0.5"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Mark Read</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="text-slate-400 hover:text-rose-600 text-[9px] font-bold flex items-center gap-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Avatar Circle */}
              <div 
                onClick={() => setActiveTab("profile")}
                className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer border border-emerald-500/25 shrink-0"
              >
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </header>

          {/* Active Tab Panel */}
          <main className="flex-1 overflow-y-auto p-6">
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "tracker" && <TrackerView />}
            {activeTab === "simulator" && <SimulatorView />}
            {activeTab === "recommendations" && <RecommendationsView />}
            {activeTab === "reports" && <ReportsView />}
            {activeTab === "heatmap" && <HeatmapView />}
            {activeTab === "challenges" && <ChallengesView />}
            {activeTab === "events" && <EventsView />}
            {activeTab === "games" && <GamesView />}
            {activeTab === "community" && <CommunityView />}
            {activeTab === "learning" && <LearningHubView />}
            {activeTab === "profile" && <ProfileView />}
            {activeTab === "settings" && <SettingsView />}
            {activeTab === "chatbot" && <ChatbotView />}
          </main>
        </div>
      </div>
    );
  }

  // Render Login / Signup Page (Unauthenticated)
  return (
    <div className="flex min-h-screen bg-slate-950 font-sans antialiased text-slate-200">
      
      {/* Left Column (Stats & Visual Branding) */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-gradient-to-tr from-[#021f10] via-[#052e16] to-slate-950 p-12 flex-col justify-between select-none">
        
        {/* Animated backdrop gradient */}
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 rounded-xl text-emerald-950">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            EcoSphere <span className="text-emerald-400">AI</span>
          </span>
        </div>

        {/* Vision Copy */}
        <div className="my-auto max-w-lg space-y-6">
          <div className="space-y-3">
            <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Intelligent Carbon Awareness</span>
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white font-sans">
              Track Less. <br />
              Understand More. <br />
              <span className="text-emerald-400 underline decoration-wavy decoration-emerald-500/30">Reduce Intelligently.</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Join millions of eco-warriors building a cleaner, greener and sustainable future for our planet. Get AI-powered receipt tracking, incident filing and local community connection.
          </p>

          {/* Quick stats items */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-6 text-xs">
            <div>
              <span className="text-2xl font-black text-white block">2.5M+</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">Active Users</span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-400 block">18.7M+</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">kg CO₂ Saved</span>
            </div>
            <div>
              <span className="text-2xl font-black text-white block">5.6K+</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">NGO Events</span>
            </div>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 max-w-sm backdrop-blur-md">
          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            "EcoSphere AI helped me understand my impact and take meaningful actions every day."
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400">
            <div className="w-5 h-5 rounded-full bg-emerald-700" />
            <span>Ananya Sharma, Eco Leader</span>
            <div className="ml-auto text-emerald-400">★★★★★</div>
          </div>
        </div>

      </div>

      {/* Right Column (Authentication Form Card) */}
      <div className="flex-1 lg:w-5/12 bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        {/* Glow behind container */}
        <div className="absolute w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-extrabold text-white">
              {isSignup ? "Create Account" : "Welcome Back! 👋"}
            </h2>
            <p className="text-xs text-slate-400">
              {isSignup ? "Sign up to start your eco-journey" : "Login to continue your eco-journey"}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Show errors */}
            {authError && (
              <div className="p-3 bg-red-500/15 border border-red-500/35 rounded-xl text-red-400 text-xs font-semibold">
                {authError}
              </div>
            )}

            {isSignup && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl py-2.5 pl-10 pr-4 outline-none text-xs font-semibold text-slate-200 placeholder-slate-600"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="youremail@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl py-2.5 pl-10 pr-4 outline-none text-xs font-semibold text-slate-200 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-600 rounded-xl py-2.5 pl-10 pr-4 outline-none text-xs font-semibold text-slate-200 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-700/10 cursor-pointer"
            >
              {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSignup ? "Sign Up" : "Login"}</span>
            </button>
          </form>

          {/* Social Logins */}
          <div className="mt-6 space-y-4">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-600 text-[10px] font-black uppercase">or continue with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400">
              <button 
                onClick={() => alert("Google login simulated!")}
                className="py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl hover:text-white transition"
              >
                Google
              </button>
              <button 
                onClick={() => alert("Apple login simulated!")}
                className="py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl hover:text-white transition"
              >
                Apple
              </button>
              <button 
                onClick={() => alert("Microsoft login simulated!")}
                className="py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl hover:text-white transition"
              >
                Microsoft
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-6">
            <span>
              {isSignup ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-emerald-400 font-bold hover:underline"
            >
              {isSignup ? "Login" : "Sign up"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
