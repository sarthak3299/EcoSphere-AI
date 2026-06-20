"use client";

import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { 
  Car, 
  Zap, 
  UtensilsCrossed, 
  ShoppingBag, 
  Trash2, 
  Droplet,
  ArrowRightLeft,
  CheckCircle2,
  TreePine,
  Lightbulb
} from "lucide-react";

interface Option {
  id: string;
  name: string;
  co2: number; // kg per day
}

const CATEGORIES = [
  { id: "Transport", label: "Transport", icon: Car },
  { id: "Electricity", label: "Electricity", icon: Zap },
  { id: "Food", label: "Food", icon: UtensilsCrossed },
  { id: "Shopping", label: "Shopping", icon: ShoppingBag },
  { id: "Waste", label: "Waste", icon: Trash2 },
  { id: "Water", label: "Water", icon: Droplet },
];

const SIMULATOR_DATA: Record<string, { current: Option; alternatives: Option[] }> = {
  Transport: {
    current: { id: "motorcycle", name: "Motorcycle (Commute)", co2: 4.2 },
    alternatives: [
      { id: "bicycle", name: "Bicycle (Commute)", co2: 0.2 },
      { id: "metro", name: "Public Metro / Bus", co2: 0.6 },
      { id: "carpool", name: "Carpooling", co2: 1.2 },
      { id: "ev_scooter", name: "Electric Scooter", co2: 1.0 }
    ]
  },
  Electricity: {
    current: { id: "grid", name: "Standard Grid Power", co2: 15.0 },
    alternatives: [
      { id: "solar", name: "Rooftop Solar Array", co2: 1.0 },
      { id: "hybrid", name: "Grid + Battery Backup", co2: 7.5 }
    ]
  },
  Food: {
    current: { id: "meat", name: "Meat Heavy Diet", co2: 3.3 },
    alternatives: [
      { id: "vegetarian", name: "Vegetarian Diet", co2: 1.2 },
      { id: "vegan", name: "Vegan Diet", co2: 0.6 }
    ]
  },
  Shopping: {
    current: { id: "fast_fashion", name: "Fast Fashion / Retail Import", co2: 25.0 },
    alternatives: [
      { id: "second_hand", name: "Thrifted / Second Hand", co2: 2.0 },
      { id: "local_made", name: "Locally Sourced Organic", co2: 8.0 }
    ]
  },
  Waste: {
    current: { id: "landfill", name: "All Unsorted to Landfill", co2: 6.0 },
    alternatives: [
      { id: "compost_recycle", name: "Recycling + Home Composting", co2: 0.5 },
      { id: "recycle_only", name: "Recycling Only", co2: 2.5 }
    ]
  },
  Water: {
    current: { id: "long_showers", name: "Long Showers & Tap Running", co2: 0.3 },
    alternatives: [
      { id: "low_flow", name: "Low-Flow Fixtures & Smart Tap Usage", co2: 0.05 }
    ]
  }
};

export default function SimulatorView() {
  const [activeCategory, setActiveCategory] = useState("Transport");
  const [selectedAlternativeIdState, setSelectedAlternativeIdState] = useState<string | null>(null);
  const [prevCategory, setPrevCategory] = useState(activeCategory);

  const simulationData = useMemo(() => {
    return SIMULATOR_DATA[activeCategory] || SIMULATOR_DATA.Transport;
  }, [activeCategory]);

  const currentOption = simulationData.current;
  const alternatives = simulationData.alternatives;

  if (activeCategory !== prevCategory) {
    setPrevCategory(activeCategory);
    setSelectedAlternativeIdState(null);
  }

  const selectedAlternativeId = selectedAlternativeIdState || (alternatives.length > 0 ? alternatives[0].id : null);

  const selectedAlternative = useMemo(() => {
    return alternatives.find((alt) => alt.id === selectedAlternativeId) || alternatives[0];
  }, [alternatives, selectedAlternativeId]);

  // Calculations
  const co2Current = currentOption.co2;
  const co2Alt = selectedAlternative ? selectedAlternative.co2 : 0;
  
  const dailyReduction = Math.max(0, co2Current - co2Alt);
  const monthlySavings = dailyReduction * 30;
  const yearlySavings = dailyReduction * 365;
  const reductionPercentage = co2Current > 0 ? (dailyReduction / co2Current) * 100 : 0;

  // Equivalents
  const treesPlanted = Math.round(monthlySavings / 1.6); // 1.6kg per tree per month
  const kmNotDriven = Math.round(yearlySavings / 0.18); // 0.18kg per km petrol car
  const kwhSaved = Math.round(yearlySavings / 0.85); // 0.85kg per kwh grid
  const waterSaved = Math.round(yearlySavings * 40); // lit. equivalent multiplier

  // Projection Chart Data (Current accumulated vs Alternative accumulated over 12 months)
  const chartData = useMemo(() => {
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, idx) => {
      const days = (idx + 1) * 30;
      return {
        name: month,
        "Current Choice": Math.round(co2Current * days),
        "Alternative Choice": Math.round(co2Alt * days)
      };
    });
  }, [co2Current, co2Alt]);

  const handleApply = () => {
    alert(`Successfully applied! You selected '${selectedAlternative.name}'. Your daily carbon records will automatically reflect this habit adjustment!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Description header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Carbon Simulator 🎛️</h1>
        <p className="text-slate-500 mt-1">See how small changes in your lifestyle can make a big impact.</p>
      </div>

      {/* Categories Tabs Row */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none select-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold shrink-0 transition ${
                isActive 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10" 
                  : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Simulator Input Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          
          {/* Current Choice Block */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Choice</h4>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">{currentOption.name}</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">{currentOption.co2} kg CO₂e / day</span>
            </div>
          </div>

          {/* Swap divider icon */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600 shadow-sm">
              <ArrowRightLeft className="w-4 h-4 rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Alternative Choice Selectors list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose an Alternative</h4>
            <div className="space-y-2.5">
              {alternatives.map((alt) => {
                const isSelected = selectedAlternativeId === alt.id;
                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlternativeIdState(alt.id)}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? "bg-emerald-50/20 border-emerald-500 shadow-xs"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{alt.name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">{alt.co2} kg CO₂e / day</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Card: Simulator Output Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">Simulation Impact</span>
            <h3 className="font-extrabold text-slate-800 text-lg mt-2">
              {reductionPercentage > 0 ? "Great Choice! 🌱" : "No Change Detected"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedAlternative ? `Switching to ${selectedAlternative.name} yields the following savings:` : ""}
            </p>
          </div>

          {/* Telemetry savings row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block">Daily Reduction</span>
              <span className="text-base font-extrabold text-emerald-700 mt-1 block">-{dailyReduction.toFixed(1)} kg</span>
              <span className="text-[9px] text-emerald-600 font-bold">-{reductionPercentage.toFixed(1)}% CO₂e</span>
            </div>
            <div className="p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block">Monthly Savings</span>
              <span className="text-base font-extrabold text-emerald-700 mt-1 block">-{monthlySavings.toFixed(0)} kg</span>
              <span className="text-[9px] text-emerald-600 font-bold">-{treesPlanted} tree-months</span>
            </div>
            <div className="p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block">Yearly Savings</span>
              <span className="text-base font-extrabold text-emerald-700 mt-1 block">-{yearlySavings.toFixed(0)} kg</span>
              <span className="text-[9px] text-emerald-600 font-bold">-{kmNotDriven} km offset</span>
            </div>
          </div>

          {/* Environmental Equivalents */}
          <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <TreePine className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Equivalent to planting <span className="font-bold text-slate-700">{treesPlanted} trees</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Averting <span className="font-bold text-slate-700">{kmNotDriven} km</span> driving mileage</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Saving <span className="font-bold text-slate-700">{kwhSaved} kWh</span> grid electricity</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Saving <span className="font-bold text-slate-700">{waterSaved.toLocaleString()} L</span> clean water</span>
            </div>
          </div>

          {/* Projection Chart */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected Cumulative Impact (1 Year)</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                  <YAxis fontSize={10} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Area type="monotone" dataKey="Current Choice" stroke="#ef4444" fill="transparent" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="Alternative Choice" stroke="#22c55e" fill="rgba(34, 197, 94, 0.05)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            onClick={handleApply}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Apply This Habit Change
          </button>
        </div>

      </div>
    </div>
  );
}
