"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { api } from "@/services/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Car,
  Zap,
  UtensilsCrossed,
  ShoppingBag,
  Trash2,
  Droplet,
  Sparkles,
  Upload,
  Loader2,
  CheckCircle
} from "lucide-react";

interface OCRResult {
  analysis: {
    confidence_score: number;
    utility_type: string;
    consumption_value: number;
    units: string;
    cost: number;
    estimated_carbon_footprint: number;
    insights: string;
  };
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Transport": Car,
  "Electricity": Zap,
  "Food": UtensilsCrossed,
  "Shopping": ShoppingBag,
  "Waste": Trash2,
  "Water": Droplet
};

const CATEGORY_COLORS: Record<string, string> = {
  "Transport": "bg-emerald-500",
  "Electricity": "bg-blue-500",
  "Food": "bg-amber-500",
  "Shopping": "bg-purple-500",
  "Waste": "bg-orange-500",
  "Water": "bg-sky-500"
};

export default function TrackerView() {
  const { dashboardData, refreshData, showToast } = useApp();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Transport");
  
  // OCR upload state
  const [billFile, setBillFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  
  // Form logging state
  const [distance, setDistance] = useState("10");
  const [transportMode, setTransportMode] = useState("car_petrol");
  const [kwh, setKwh] = useState("15");
  const [diet, setDiet] = useState("average_meat");
  const [shopType, setShopType] = useState("general");
  const [shopItems, setShopItems] = useState("2");
  const [wasteWeight, setWasteWeight] = useState("3");
  const [wasteType, setWasteType] = useState("unsorted");
  const [waterLiters, setWaterLiters] = useState("150");

  const [formLoading, setFormLoading] = useState(false);

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const { total_footprint, daily_average, category_breakdowns, category_percentages, monthly_trend } = dashboardData;

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    let details: Record<string, string | number> = {};

    if (activeCategory === "Transport") {
      details = { mode: transportMode, distance: parseFloat(distance) };
    } else if (activeCategory === "Electricity") {
      details = { source: "grid", kwh: parseFloat(kwh) };
    } else if (activeCategory === "Food") {
      details = { diet, days: 1 };
    } else if (activeCategory === "Shopping") {
      details = { type: shopType, items: parseFloat(shopItems) };
    } else if (activeCategory === "Waste") {
      details = { type: wasteType, weight: parseFloat(wasteWeight) };
    } else if (activeCategory === "Water") {
      details = { liters: parseFloat(waterLiters) };
    }

    try {
      await api.carbon.addEntry(activeCategory, details);
      await refreshData();
      setIsLogModalOpen(false);
      showToast("Carbon footprint entry logged successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to log footprint", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOCRUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billFile) return;

    setOcrLoading(true);
    setOcrResult(null);

    try {
      const res = await api.carbon.uploadBill(billFile);
      setOcrResult(res);
      await refreshData();
      showToast("Receipt uploaded and parsed successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to parse receipt", "error");
    } finally {
      setOcrLoading(false);
    }
  };

  const openLogModal = (cat: string) => {
    setActiveCategory(cat);
    setIsLogModalOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Columns (Breakdowns & Graph) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Footprint Header Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">Carbon Footprint</span>
            <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{total_footprint} kg CO₂e</h2>
            <p className="text-xs text-slate-400 mt-1">This month&apos;s total aggregated footprint</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="border-l border-slate-100 pl-6">
              <span className="text-xs text-slate-400 font-medium">Daily Average</span>
              <h4 className="text-lg font-bold text-slate-700 mt-0.5">{daily_average} kg</h4>
            </div>
            <div className="border-l border-slate-100 pl-6">
              <span className="text-xs text-slate-400 font-medium">Monthly Target</span>
              <h4 className="text-lg font-bold text-slate-700 mt-0.5">400 kg</h4>
            </div>
          </div>
        </div>

        {/* Category Breakdown Progress Bars */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover-premium space-y-4">
          <h3 className="font-bold text-slate-800">Breakdown by Category</h3>
          <div className="space-y-4">
            {Object.entries(category_breakdowns).map(([cat, val]) => {
              const Icon = CATEGORY_ICONS[cat] || Car;
              const colorClass = CATEGORY_COLORS[cat] || "bg-emerald-500";
              const percent = category_percentages[cat] || 0.0;
              return (
                <div key={cat} className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>{cat}</span>
                      <span>{val as number} kg CO₂e ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart View */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover-premium">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Emissions Trend</h3>
            <div className="flex bg-slate-50 border border-slate-100 rounded-lg p-0.5 text-xs font-bold text-slate-500">
              <button className="px-3 py-1 bg-white text-slate-700 shadow-sm rounded-md">Month</button>
              <button className="px-3 py-1">Year</button>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trackerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#trackerGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Right Column (Quick Logs & Summary) */}
      <div className="space-y-6">
        
        {/* Quick Add Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800">Quick Add Entry</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select a category to manually log emissions</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(CATEGORY_ICONS).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => openLogModal(cat)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-slate-600 hover:text-emerald-700 transition"
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">{cat}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsOCRModalOpen(true)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Utility Bill (OCR)</span>
          </button>
        </div>

        {/* Tips List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Tips to Reduce Emissions</h3>
          <div className="space-y-3">
            <div className="flex gap-3 text-xs">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-slate-600 font-medium">Use a programmable thermostat to save energy automatically while away.</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-slate-600 font-medium">Unplug electronics like chargers, TVs, and microwave stands to avoid standby draw.</p>
            </div>
            <div className="flex gap-3 text-xs">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-slate-600 font-medium">Switch to public transport or bundle multiple errands into a single drive.</p>
            </div>
          </div>
        </div>

        {/* Monthly Summary Statistics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 mb-2">This Month Summary</h3>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Days Tracked</span>
            <span className="font-bold text-slate-800">19 / 30</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Best Tracked Day</span>
            <span className="font-bold text-emerald-700">9.4 kg CO₂e</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total logged entries</span>
            <span className="font-bold text-slate-800">27 logged</span>
          </div>
        </div>

      </div>

      {/* Manual Entry Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>Log {activeCategory} Entry</span>
              </h3>
              <button 
                onClick={() => setIsLogModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualLog} className="p-6 space-y-4">
              {/* Category-specific form inputs */}
              {activeCategory === "Transport" && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="transportModeSelect" className="text-xs font-bold text-slate-600">Mode of Transport</label>
                    <select 
                      id="transportModeSelect"
                      value={transportMode} 
                      onChange={(e) => setTransportMode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700"
                    >
                      <option value="car_petrol">Petrol Car</option>
                      <option value="car_diesel">Diesel Car</option>
                      <option value="car_ev">Electric Vehicle (EV)</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="metro">Metro/Subway</option>
                      <option value="bus">Public Bus</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="distanceInput" className="text-xs font-bold text-slate-600">Distance Traveled (km)</label>
                    <input 
                      id="distanceInput"
                      type="number" 
                      value={distance} 
                      onChange={(e) => setDistance(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700" 
                      required
                    />
                  </div>
                </>
              )}

              {activeCategory === "Electricity" && (
                <div className="space-y-1">
                  <label htmlFor="kwhInput" className="text-xs font-bold text-slate-600">Electricity Consumed (kWh)</label>
                  <input 
                    id="kwhInput"
                    type="number" 
                    value={kwh} 
                    onChange={(e) => setKwh(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700" 
                    required
                  />
                </div>
              )}

              {activeCategory === "Food" && (
                <div className="space-y-1">
                  <label htmlFor="dietSelect" className="text-xs font-bold text-slate-600">Diet Habit Today</label>
                  <select 
                    id="dietSelect"
                    value={diet} 
                    onChange={(e) => setDiet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="heavy_meat">Heavy Meat Eater</option>
                    <option value="average_meat">Average Meat Eater</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              )}

              {activeCategory === "Shopping" && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="shopTypeSelect" className="text-xs font-bold text-slate-600">Purchase Category</label>
                    <select 
                      id="shopTypeSelect"
                      value={shopType} 
                      onChange={(e) => setShopType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700"
                    >
                      <option value="general">General Items</option>
                      <option value="clothing">Clothing/Fashion</option>
                      <option value="electronics">Electronics/Gadgets</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="shopItemsInput" className="text-xs font-bold text-slate-600">Number of Items</label>
                    <input 
                      id="shopItemsInput"
                      type="number" 
                      value={shopItems} 
                      onChange={(e) => setShopItems(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700" 
                      required
                    />
                  </div>
                </>
              )}

              {activeCategory === "Waste" && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="wasteTypeSelect" className="text-xs font-bold text-slate-600">Type of Waste</label>
                    <select 
                      id="wasteTypeSelect"
                      value={wasteType} 
                      onChange={(e) => setWasteType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700"
                    >
                      <option value="unsorted">Unsorted Waste</option>
                      <option value="recyclable">Recyclable Waste</option>
                      <option value="compost">Organic Waste/Compost</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="wasteWeightInput" className="text-xs font-bold text-slate-600">Weight of Waste (kg)</label>
                    <input 
                      id="wasteWeightInput"
                      type="number" 
                      value={wasteWeight} 
                      onChange={(e) => setWasteWeight(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700" 
                      required
                    />
                  </div>
                </>
              )}

              {activeCategory === "Water" && (
                <div className="space-y-1">
                  <label htmlFor="waterLitersInput" className="text-xs font-bold text-slate-600">Water Consumption (Liters)</label>
                  <input 
                    id="waterLitersInput"
                    type="number" 
                    value={waterLiters} 
                    onChange={(e) => setWaterLiters(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700" 
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Bill Upload Modal */}
      {isOCRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-xl overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>Analyze Utility Bill (AI OCR)</span>
              </h3>
              <button 
                onClick={() => { setIsOCRModalOpen(false); setOcrResult(null); setBillFile(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {!ocrResult ? (
                <form onSubmit={handleOCRUpload} className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Upload an electricity bill, fuel slip, or water receipt. The system&apos;s multimodal Gemini OCR will extract raw values, compute carbon metrics, and log the carbon footprints.
                  </p>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-400 cursor-pointer relative bg-slate-50">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      required
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-600 block">
                      {billFile ? billFile.name : "Select Receipt Image"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Supports PNG, JPG, or JPEG</span>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOCRModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={ocrLoading || !billFile}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      {ocrLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing (Gemini OCR)...</span>
                        </>
                      ) : (
                        <span>Start Analysis</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-emerald-600 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/50">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Receipt Logged Successfully!</h4>
                      <p className="text-[10px] text-slate-500">Gemini extracted all values with {Math.round(ocrResult.analysis.confidence_score * 100)}% confidence.</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Utility Category</span>
                      <span className="font-bold text-slate-700">{ocrResult.analysis.utility_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consumption Extracted</span>
                      <span className="font-bold text-slate-700">{ocrResult.analysis.consumption_value} {ocrResult.analysis.units}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cost on Receipt</span>
                      <span className="font-bold text-slate-700">${ocrResult.analysis.cost}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/50 pt-2.5">
                      <span className="text-slate-400 font-medium">Estimated Footprint</span>
                      <span className="font-black text-emerald-700 text-sm">{ocrResult.analysis.estimated_carbon_footprint} kg CO₂e</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50/20 border border-emerald-100/20 rounded-xl flex gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-emerald-900 leading-relaxed"><span className="font-bold">AI Insight:</span> {ocrResult.analysis.insights}</p>
                  </div>

                  <button
                    onClick={() => { setIsOCRModalOpen(false); setOcrResult(null); setBillFile(null); }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
