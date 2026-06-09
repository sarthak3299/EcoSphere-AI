"use client";

import React from "react";
import { useApp } from "@/store/AppContext";
import { 
  Award, 
  Leaf, 
  Calendar, 
  FileText, 
  Activity, 
  MapPin, 
  Mail, 
  CalendarRange 
} from "lucide-react";

export default function ProfileView() {
  const { user, dashboardData } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Profile 👤</h1>
        <p className="text-slate-500 mt-1">Manage your eco status, review credentials, and inspect unlocked badges.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-emerald-700 text-white flex items-center justify-center text-4xl font-extrabold border-4 border-emerald-500/25 shadow-md">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">{user?.name || "Ananya Sharma"}</h2>
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
              Eco Warrior (Level {user?.level || 2})
            </p>
          </div>
          
          <div className="w-full border-t border-slate-50 pt-4 space-y-2.5 text-xs text-slate-500 text-left">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{user?.email || "ananya@ecosphere.ai"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "June 2026"}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="font-extrabold text-slate-800 text-sm">Carbon Metrics & Stats</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Eco Score</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">{user?.eco_score || 748}</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Level XP</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">{user?.xp || 240} / {user?.level ? user.level * 100 : 200}</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Events Joined</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">5 events</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Reports Filed</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">14 reports</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Badges Drawer list */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs">Unlocked Achievements</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Eco Starter", desc: "First carbon record logged", date: "June 2026", color: "bg-emerald-100 text-emerald-700" },
                { name: "Green Habit", desc: "Logged 10 daily carbon entries", date: "June 2026", color: "bg-emerald-600 text-white" },
                { name: "Carbon Saver", desc: "Reduced footprint by 20% compared to baseline", date: "June 2026", color: "bg-purple-100 text-purple-700" },
                { name: "Community Hero", desc: "Joined first cleanup campaign", date: "June 2026", color: "bg-orange-100 text-orange-700" }
              ].map((badge, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-slate-200/50 mb-2 ${badge.color}`}>
                    <Award className="w-5 h-5" fill={badge.color.includes("white") ? "none" : "currentColor"} />
                  </div>
                  <h5 className="text-[10px] font-bold text-slate-800">{badge.name}</h5>
                  <p className="text-[8px] text-slate-400 mt-0.5 line-clamp-1">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
