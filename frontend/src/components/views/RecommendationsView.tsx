"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { api } from "@/services/api";
import { 
  Sparkles, 
  Leaf, 
  ArrowRight,
  TrendingDown,
  Loader2,
  CheckCircle
} from "lucide-react";

export default function RecommendationsView() {
  const { recommendations, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState("All");
  const [generating, setGenerating] = useState(false);
  const [appliedRecs, setAppliedRecs] = useState<string[]>([]);

  const filteredRecs = recommendations.filter((rec) => {
    if (activeTab === "All") return true;
    return rec.category.toLowerCase() === activeTab.toLowerCase();
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await refreshData();
    } catch (err) {
      alert("Failed to sync new recommendations.");
    } finally {
      setGenerating(false);
    }
  };

  const handleTakeAction = (recId: string, title: string) => {
    setAppliedRecs((prev) => [...prev, recId]);
    alert(`Added Action Goal: '${title}'. You will be prompted to track progress daily!`);
  };

  const tabs = ["All", "Transport", "Electricity", "Food", "Shopping"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">AI Recommendations ✨</h1>
          <p className="text-slate-500 mt-1">Personalized, data-driven tips generated specifically for your carbon profile.</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 self-start bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Generate Fresh Recommendations</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold transition-all relative ${
              activeTab === tab 
                ? "text-emerald-700 font-extrabold border-b-2 border-emerald-600" 
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "Electricity" ? "Home Energy" : tab}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecs.map((rec) => {
          const isApplied = appliedRecs.includes(rec.id);
          const diffColor = 
            rec.difficulty === "Easy" ? "text-emerald-700 bg-emerald-50" :
            rec.difficulty === "Medium" ? "text-amber-700 bg-amber-50" :
            "text-red-700 bg-red-50";

          return (
            <div 
              key={rec.id} 
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
            >
              {/* Highlight background glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50/40 to-transparent rounded-bl-full pointer-events-none group-hover:from-emerald-50/60 transition" />
              
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${diffColor}`}>
                    {rec.difficulty}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {rec.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{rec.title}</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{rec.description}</p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-50 mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span>Saves {rec.savings} kg CO₂ / mo</span>
                </div>

                <button
                  onClick={() => handleTakeAction(rec.id, rec.title)}
                  disabled={isApplied}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                    isApplied 
                      ? "bg-slate-50 text-slate-400 border border-slate-100" 
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Action Set</span>
                    </>
                  ) : (
                    <>
                      <span>Take Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredRecs.length === 0 && (
          <div className="col-span-full bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-xs font-medium">
            No recommendations generated for this category yet. Click 'Generate Fresh Recommendations' to update.
          </div>
        )}
      </div>
    </div>
  );
}
