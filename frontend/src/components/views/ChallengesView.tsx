"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { api } from "@/services/api";
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  Plus, 
  Loader2, 
  Percent, 
  Award,
  Zap,
  Leaf
} from "lucide-react";

export default function ChallengesView() {
  const { challenges, activeChallenges, refreshData } = useApp();
  const [activeSubTab, setActiveSubTab] = useState("Active");
  const [loadingChallengeId, setLoadingChallengeId] = useState<number | null>(null);

  const handleJoin = async (id: number) => {
    setLoadingChallengeId(id);
    try {
      await api.gamification.joinChallenge(id);
      await refreshData();
      alert("Joined challenge successfully! Work towards completion to earn Eco Points.");
    } catch (err) {
      alert("Failed to join challenge.");
    } finally {
      setLoadingChallengeId(null);
    }
  };

  const handleSimulateProgress = async (challengeId: number) => {
    setLoadingChallengeId(challengeId);
    try {
      const res = await api.gamification.updateProgress(challengeId, 25); // increment by 25%
      await refreshData();
      alert(res.message);
    } catch (err) {
      alert("Failed to update progress.");
    } finally {
      setLoadingChallengeId(null);
    }
  };

  // Group by Tab status
  const renderedChallenges = () => {
    if (activeSubTab === "Active") {
      return activeChallenges.filter((ac) => ac.status === "Active");
    } else if (activeSubTab === "Completed") {
      return activeChallenges.filter((ac) => ac.status === "Completed");
    } else {
      // "Upcoming" or "All Unjoined"
      const joinedIds = activeChallenges.map((ac) => ac.challenge.id);
      return challenges.filter((c) => !joinedIds.includes(c.id));
    }
  };

  const currentList = renderedChallenges();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Challenges 🏆</h1>
        <p className="text-slate-500 mt-1">Take part in gamified eco-challenges, log habits, and earn Eco Points and badges.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {["Active", "Upcoming (Discover)", "Completed"].map((tabLabel) => {
          const id = tabLabel.split(" ")[0]; // "Active", "Upcoming", "Completed"
          const count = 
            id === "Active" ? activeChallenges.filter((ac) => ac.status === "Active").length :
            id === "Completed" ? activeChallenges.filter((ac) => ac.status === "Completed").length :
            challenges.length - activeChallenges.length;

          const isActive = activeSubTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSubTab(id)}
              className={`px-4 py-2 text-xs font-bold transition relative ${
                isActive 
                  ? "text-emerald-700 font-extrabold border-b-2 border-emerald-600" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tabLabel}</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentList.map((item) => {
          // Check if displaying UserChallenge details (Active/Completed) or general Challenge details (Upcoming)
          const isUserChallenge = "challenge" in item;
          const challenge = isUserChallenge ? item.challenge : item;
          const progress = isUserChallenge ? item.progress : 0;
          const isCompleted = isUserChallenge && item.status === "Completed";
          
          const isLoading = loadingChallengeId === challenge.id;

          const diffColor = 
            challenge.difficulty === "Easy" ? "text-emerald-700 bg-emerald-50" :
            challenge.difficulty === "Medium" ? "text-amber-700 bg-amber-50" :
            "text-red-700 bg-red-50";

          return (
            <div 
              key={challenge.id} 
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition relative overflow-hidden"
            >
              <div className="space-y-4">
                
                {/* Header indicators */}
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className={`px-2 py-0.5 rounded-md uppercase tracking-wider ${diffColor}`}>
                    {challenge.difficulty}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{challenge.duration_days} days</span>
                  </div>
                </div>

                {/* Challenge Title */}
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{challenge.title}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{challenge.description}</p>
                </div>

                {/* Progress bar for Active Challenges */}
                {isUserChallenge && !isCompleted && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-emerald-600" />
                        <span>Progress</span>
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>+{challenge.points} Eco Points</span>
                </span>

                {isUserChallenge ? (
                  isCompleted ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSimulateProgress(challenge.id)}
                      disabled={isLoading}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Log Activity (+25%)</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleJoin(challenge.id)}
                    disabled={isLoading}
                    className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-100 font-bold text-[10px] rounded-lg flex items-center gap-1 transition"
                  >
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Plus className="w-3.5 h-3.5" />
                    <span>Join Challenge</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {currentList.length === 0 && (
          <div className="col-span-full bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-xs font-medium">
            No challenges in this tab. Explore 'Upcoming' to discover and join new challenges!
          </div>
        )}
      </div>
    </div>
  );
}
