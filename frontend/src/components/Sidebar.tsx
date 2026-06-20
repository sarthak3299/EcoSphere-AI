"use client";

import React, { useState } from "react";
import { useApp, UserType } from "@/store/AppContext";
import {
  LayoutDashboard,
  Footprints,
  Gauge,
  Sparkles,
  FileText,
  Map,
  Trophy,
  Calendar,
  Gamepad2,
  Users,
  BookOpen,
  User,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Leaf
} from "lucide-react";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tracker", label: "Carbon Tracker", icon: Footprints },
  { id: "simulator", label: "Simulator", icon: Gauge },
  { id: "recommendations", label: "AI Recommendations", icon: Sparkles },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "heatmap", label: "Heatmap", icon: Map },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "events", label: "Events & Campaigns", icon: Calendar },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "community", label: "Community", icon: Users },
  { id: "learning", label: "Learning Hub", icon: BookOpen },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

interface SidebarContentProps {
  activeTab: string;
  user: UserType | null;
  handleNav: (tabId: string) => void;
  logout: () => void;
}

function SidebarContent({ activeTab, user, handleNav, logout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar-bg text-sidebar-fg">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-emerald-900/50">
        <div className="p-2 bg-emerald-500 rounded-lg text-emerald-950">
          <Leaf className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-sans">
          EcoSphere <span className="text-emerald-400">AI</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 select-none">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-active text-white shadow-md shadow-emerald-950/40"
                  : "text-emerald-100/70 hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Call to Action Banner */}
      <div className="mx-4 my-2 p-4 rounded-xl bg-emerald-900/40 border border-emerald-800/30 text-center relative overflow-hidden hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
        <Leaf className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
        <p className="text-xs font-semibold text-emerald-100">Together, we can build a greener future!</p>
        <button 
          onClick={() => handleNav("challenges")} 
          className="mt-2.5 w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs py-1.5 px-3 rounded-lg transition"
        >
          Explore Now
        </button>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-t border-emerald-900/50 bg-[#021f10]/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg border border-emerald-500/25">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">{user?.name || "Ananya Sharma"}</h4>
            <p className="text-xs text-emerald-400 font-medium">Eco Warrior</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          title="Sign Out" 
          className="p-2 rounded-lg text-emerald-300 hover:bg-emerald-900/40 hover:text-red-400 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { activeTab, setActiveTab, user, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const handleNav = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="flex lg:hidden items-center justify-between px-6 py-4 bg-sidebar-bg text-white border-b border-emerald-900/50 w-full z-30">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-400" />
          <span className="font-bold tracking-tight">EcoSphere AI</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1 text-emerald-100 hover:text-white"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 flex-shrink-0 z-20">
        <SidebarContent 
          activeTab={activeTab} 
          user={user} 
          handleNav={handleNav} 
          logout={logout} 
        />
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          {/* Drawer Panel */}
          <div className="relative w-64 max-w-xs h-full bg-sidebar-bg flex flex-col z-50">
            <SidebarContent 
              activeTab={activeTab} 
              user={user} 
              handleNav={handleNav} 
              logout={logout} 
            />
          </div>
        </div>
      )}
    </>
  );
}
