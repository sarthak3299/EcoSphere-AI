"use client";

import React from "react";
import { useApp } from "@/store/AppContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { 
  TrendingDown, 
  TrendingUp, 
  Leaf, 
  Flame, 
  Droplet, 
  ChevronRight, 
  Award,
  Sparkles,
  ArrowRight,
  Share2
} from "lucide-react";

export default function DashboardView() {
  const { user, dashboardData, recommendations, events, setActiveTab } = useApp();
  const [monthlyBudget, setMonthlyBudget] = React.useState<number>(500);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("monthly_carbon_budget");
      if (saved) {
        setMonthlyBudget(parseInt(saved, 10));
      }
    }
  }, []);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setMonthlyBudget(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("monthly_carbon_budget", value.toString());
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const { total_footprint, daily_average, category_breakdowns, category_percentages, monthly_trend, recent_activity } = dashboardData;

  // Dynamic calculations to make the dashboard alive and reactive
  const treesOffset = Math.max(1, Math.round(total_footprint / 30));
  const energySaved = Math.round((user?.eco_score || 748) * 0.2);
  const waterSaved = Math.round((user?.eco_score || 748) * 1.6);
  const userLevel = user?.level || 2;
  const userScore = user?.eco_score || 748;

  const budgetPercent = Math.min(100, Math.round((total_footprint / monthlyBudget) * 100));
  const isOverBudget = total_footprint >= monthlyBudget;
  const isNearBudget = total_footprint >= monthlyBudget * 0.8 && total_footprint < monthlyBudget;

  let gaugeColor = "#22c55e"; // Emerald
  let gaugeText = "Safe Range 🌿";
  let gaugeTextColor = "text-emerald-600";
  if (total_footprint >= monthlyBudget) {
    gaugeColor = "#ef4444"; // Red
    gaugeText = "Limit Exceeded! ⚠️";
    gaugeTextColor = "text-red-600";
  } else if (total_footprint >= monthlyBudget * 0.8) {
    gaugeColor = "#f59e0b"; // Amber
    gaugeText = "Warning: Near Limit ⚠️";
    gaugeTextColor = "text-amber-500";
  }

  const sortedCategories = Object.entries(category_breakdowns as Record<string, number> || {})
    .sort((a, b) => b[1] - a[1]);
  const topCategoryName = sortedCategories[0]?.[0] || "None";
  const topCategoryVal = sortedCategories[0]?.[1] || 0;
  const topCategoryPercent = total_footprint > 0 ? Math.round((topCategoryVal / total_footprint) * 100) : 0;

  // Pie chart data for Top Contributing Sources
  const pieData = Object.entries(category_breakdowns)
    .filter(([_, val]) => (val as number) > 0)
    .map(([key, val]) => ({
      name: key,
      value: val as number
    }));

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#6b7280"];

  return (
    <div className="space-y-6 animate-fade-in p-1">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.name || "Ananya"}! 🌿
          </h1>
          <p className="text-slate-500 mt-1">Here's your environmental impact overview.</p>
        </div>
        <button 
          onClick={() => alert("Sharing impact to social feed!")}
          className="flex items-center gap-2 self-start bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Impact</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Carbon Footprint */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Carbon Footprint</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">{total_footprint} <span className="text-sm font-normal text-slate-500">kg CO₂</span></h3>
            <p className="text-xs text-slate-400 mt-0.5">This Month</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-3">
            <TrendingDown className="w-4 h-4" />
            <span>12% vs last month</span>
          </div>
        </div>

        {/* Trees Equivalent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Trees Offset</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Leaf className="w-5 h-5" fill="currentColor" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">{treesOffset} <span className="text-sm font-normal text-slate-500">Trees</span></h3>
            <p className="text-xs text-slate-400 mt-0.5">To offset emissions</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-3">
            <TrendingUp className="w-4 h-4" />
            <span>Calculated from active logs</span>
          </div>
        </div>

        {/* Energy Saved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Energy Saved</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">{energySaved} <span className="text-sm font-normal text-slate-500">kWh</span></h3>
            <p className="text-xs text-slate-400 mt-0.5">This Month</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-3">
            <TrendingUp className="w-4 h-4" />
            <span>Based on Eco Score rank</span>
          </div>
        </div>

        {/* Water Saved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Water Saved</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">{waterSaved.toLocaleString()} <span className="text-sm font-normal text-slate-500">L</span></h3>
            <p className="text-xs text-slate-400 mt-0.5">This Month</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-3">
            <TrendingDown className="w-4 h-4" />
            <span>Scale with Eco Score achievements</span>
          </div>
        </div>

        {/* Carbon Budget Arc Gauge */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-sm font-semibold text-slate-500 mb-1">Carbon Budget</span>
          <div className="relative w-36 h-20 flex items-center justify-center overflow-hidden">
            {/* SVG Arc Gauge */}
            <svg className="absolute bottom-0 w-36 h-18">
              <path 
                d="M 10,70 A 60,60 0 0,1 134,70" 
                fill="none" 
                stroke="#e2e8f0" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
              <path 
                d="M 10,70 A 60,60 0 0,1 134,70" 
                fill="none" 
                stroke={gaugeColor} 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray="200"
                strokeDashoffset={200 - (200 * budgetPercent) / 100}
              />
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center">
              <span className="text-xl font-black text-slate-800">{total_footprint}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase">/ {monthlyBudget} kg</span>
            </div>
          </div>
          
          {/* Slider input */}
          <div className="w-full mt-2 px-2">
            <input 
              type="range" 
              min="100" 
              max="2000" 
              step="50" 
              value={monthlyBudget} 
              onChange={handleBudgetChange}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-1">
              <span>Min: 100kg</span>
              <span>Max: 2000kg</span>
            </div>
          </div>

          <div className={`mt-2 text-xs font-bold ${gaugeTextColor}`}>{gaugeText}</div>
        </div>
      </div>

      {/* Carbon Budget Alerts / Tip Banner */}
      {(isOverBudget || isNearBudget) && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in ${
          isOverBudget ? "bg-red-50 border-red-100 text-red-800" : "bg-amber-50 border-amber-100 text-amber-800"
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">{isOverBudget ? "🚨" : "⚠️"}</span>
            <div>
              <h4 className="font-bold text-sm">
                {isOverBudget ? "Carbon Budget Exceeded!" : "Approaching Carbon Budget Limit"}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {isOverBudget 
                  ? `Your carbon footprint is ${total_footprint} kg CO₂, exceeding your set limit of ${monthlyBudget} kg by ${Math.round(total_footprint - monthlyBudget)} kg.` 
                  : `You have consumed ${budgetPercent}% of your monthly limit (${total_footprint} kg used out of ${monthlyBudget} kg).`
                }
              </p>
              <p className="text-xs font-bold mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>Tip: {
                  isOverBudget 
                    ? "Consider choosing public transit, consuming plant-based meals, or skipping non-essential purchases today to offset this."
                    : "Try unplugging idle household appliances and reducing warm water usage to keep within your budget."
                }</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("recommendations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap self-start sm:self-center ${
              isOverBudget ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            Get Reduction Tips
          </button>
        </div>
      )}

      {/* Main Grid: Telemetry + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Footprint Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Your Carbon Footprint Trend</h3>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-600 outline-none">
              <option>This Year</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFootprint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorFootprint)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Contributing Sources Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 mb-4">Top Contributing Sources</h3>
          
          <div className="h-44 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No data available</div>
            )}
            <div className="absolute flex flex-col items-center px-2 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[90px]">{topCategoryName}</span>
              <span className="text-lg font-black text-slate-800">{topCategoryPercent}%</span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {Object.entries(category_percentages)
              .filter(([_, val]) => (val as number) > 0)
              .map(([key, val], idx) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600 font-medium">{key}</span>
                  </div>
                  <span className="font-bold text-slate-800">{val as number}%</span>
                </div>
              ))}
          </div>

          <button 
            onClick={() => setActiveTab("tracker")}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all"
          >
            <span>View Full Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Recommendations + Activities + Badges */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* AI Recommendations panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-4 text-emerald-800">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">AI Recommendations</h3>
            </div>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div 
                  key={rec.id || index} 
                  onClick={() => setActiveTab("recommendations")}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/20 cursor-pointer transition-all"
                >
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{rec.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{rec.description}</p>
                    <span className="text-[9px] font-bold text-emerald-600 mt-1 inline-block">
                      -{rec.savings} kg CO₂/mo
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("recommendations")}
            className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
          >
            View All Recommendations
          </button>
        </div>

        {/* Recent Activity + Events */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Recent Activity</h3>
          <div className="space-y-3">
            {recent_activity.slice(0, 3).map((act: any, index: number) => (
              <div key={index} className="flex items-center gap-3 text-xs">
                <div className={`p-2 rounded-lg shrink-0 ${
                  act.type === "challenge" ? "bg-amber-50 text-amber-600" :
                  act.type === "report" ? "bg-red-50 text-red-600" :
                  act.type === "event" ? "bg-blue-50 text-blue-600" :
                  "bg-emerald-50 text-emerald-600"
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-medium truncate">{act.message}</p>
                  <span className="text-[9px] text-slate-400">
                    {new Date(act.time).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-slate-100" />

          {/* Upcoming Event snippet */}
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">Upcoming Events</h4>
            <button onClick={() => setActiveTab("events")} className="text-xs font-bold text-emerald-700 hover:underline">View All</button>
          </div>
          <div className="space-y-2">
            {events.slice(0, 1).map((ev: any) => (
              <div key={ev.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">{ev.title}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ev.location_text}</p>
                </div>
                <button 
                  onClick={() => setActiveTab("events")} 
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] py-1 px-3 rounded-lg transition"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements / Badges Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Your Achievements</h3>
            <button onClick={() => setActiveTab("profile")} className="text-xs font-bold text-emerald-700 hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Badge 1: Eco Starter */}
            <div className="p-3.5 bg-emerald-50/30 border border-emerald-100/50 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center border border-emerald-300/30 mb-2">
                <Award className="w-6 h-6" fill="currentColor" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Eco Starter</h4>
              <p className="text-[9px] text-slate-400 mt-0.5">Completed</p>
            </div>

            {/* Badge 2: Green Habit */}
            <div className="p-3.5 bg-emerald-50/30 border border-emerald-100/50 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center border border-emerald-400/30 mb-2">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Green Habit</h4>
              <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Level {userLevel}</p>
            </div>

            {/* Badge 3: Carbon Saver */}
            <div className="p-3.5 bg-purple-50/30 border border-purple-100/50 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center border border-purple-300/30 mb-2">
                <Award className="w-6 h-6" fill="currentColor" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Carbon Saver</h4>
              <p className="text-[9px] text-purple-600 font-semibold mt-0.5">{userScore > 800 ? "Top 5%" : userScore > 600 ? "Top 15%" : "Top 30%"}</p>
            </div>

            {/* Badge 4: Community Hero */}
            <div className="p-3.5 bg-orange-50/30 border border-orange-100/50 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center border border-orange-300/30 mb-2">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Community Hero</h4>
              <p className="text-[9px] text-orange-600 font-semibold mt-0.5">Level {Math.max(1, userLevel - 1)}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-50/30 border border-emerald-100/30 rounded-xl flex items-center gap-2 text-[10px] text-emerald-800 font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span>Small actions today, big impact tomorrow. Keep going! 💚</span>
          </div>
        </div>
      </div>
    </div>
  );
}
