"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { api } from "@/services/api";
import { Loader2, AlertTriangle, Layers, Filter } from "lucide-react";

// Dynamically import the map component with SSR disabled to prevent Node errors during build
const HeatmapMap = dynamic(() => import("@/components/HeatmapMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        <span className="text-xs font-bold text-slate-500">Mounting Leaflet Heatmap Engine...</span>
      </div>
    </div>
  )
});

export default function HeatmapView() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.incident.getAll();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load incidents coordinates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    if (categoryFilter === "All") return true;
    return inc.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const categories = ["All", "Garbage Dumping", "Air Pollution", "Water Pollution", "Plastic Waste"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Pollution Heatmap 🗺️</h1>
        <p className="text-slate-500 mt-1">Real-time geographical view of verified community environmental reports.</p>
      </div>

      {/* Categories Toolbar Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filter Hotspots:</span>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg border text-[10px] transition ${
                  categoryFilter === cat 
                    ? "bg-emerald-600 border-emerald-600 text-white font-bold" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Map Tile: Voyager Lite</span>
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Hotspots Count: {filteredIncidents.length}</span>
          </span>
        </div>
      </div>

      {/* Map Window Container */}
      <div className="relative bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm p-1.5 h-[500px] min-h-[400px]">
        {loading ? (
          <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <HeatmapMap incidents={filteredIncidents} />
        )}

        {/* Gradient Legend Overlay at the bottom */}
        <div className="absolute bottom-5 left-5 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg text-[10px] font-bold text-slate-700 space-y-1.5">
          <span>Pollution Density Index</span>
          <div className="w-36 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 rounded-full" />
          <div className="flex justify-between text-[8px] text-slate-400">
            <span>Low (Low Severity)</span>
            <span>High (High Severity)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
