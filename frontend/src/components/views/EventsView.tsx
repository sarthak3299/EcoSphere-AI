"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { api } from "@/services/api";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  CheckCircle,
  Plus,
  Loader2
} from "lucide-react";

export default function EventsView() {
  const { events, refreshData } = useApp();
  const [activeSubTab, setActiveSubTab] = useState("Upcoming");
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const handleJoin = async (id: number) => {
    setJoiningId(id);
    try {
      const res = await api.events.join(id);
      await refreshData();
      alert(res.message);
    } catch (err) {
      alert("Failed to join event.");
    } finally {
      setJoiningId(null);
    }
  };

  const renderedEvents = 
    activeSubTab === "Upcoming" 
      ? events.filter((e) => !e.joined) 
      : events.filter((e) => e.joined);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Events & Campaigns 🗓️</h1>
        <p className="text-slate-500 mt-1">Join local NGO cleanup drives, tree plantation drives, and recycling programs to offset your carbon footprint.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {["Upcoming", "My Registrations"].map((tab) => {
          const count = 
            tab === "Upcoming" 
              ? events.filter((e) => !e.joined).length 
              : events.filter((e) => e.joined).length;

          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 text-xs font-bold transition relative ${
                isActive 
                  ? "text-emerald-700 font-extrabold border-b-2 border-emerald-600" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tab}</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderedEvents.map((ev) => {
          const isJoining = joiningId === ev.id;
          const formattedDate = new Date(ev.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
          });

          return (
            <div 
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all group"
            >
              {/* Event Image Banner (Mocked illustration gradient) */}
              <div className="h-32 bg-gradient-to-tr from-emerald-800 to-teal-950 p-5 flex flex-col justify-between relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <span className="bg-white/15 backdrop-blur-md text-white border border-white/10 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider self-start">
                  NGO Campaign
                </span>
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </span>
              </div>

              {/* Event details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition">
                    {ev.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{ev.description}</p>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Organizer: <span className="font-bold text-slate-700">{ev.organizer}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Location: {ev.location_text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Participants: {ev.participant_count} registered</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50 mt-1 flex justify-end">
                  {ev.joined ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Registered</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(ev.id)}
                      disabled={isJoining}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      {isJoining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Register Now</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {renderedEvents.length === 0 && (
          <div className="col-span-full bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-xs font-medium animate-fade-in">
            {activeSubTab === "Upcoming" 
              ? "All campaigns joined! Check 'My Registrations' tab." 
              : "No campaigns registered yet. Discover events in the 'Upcoming' tab!"}
          </div>
        )}
      </div>
    </div>
  );
}
