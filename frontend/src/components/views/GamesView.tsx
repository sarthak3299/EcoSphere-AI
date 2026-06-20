"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { 
  Trash2, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Award,
  Sparkles
} from "lucide-react";

interface WasteItem {
  name: string;
  category: "recyclable" | "organic" | "hazardous";
  emoji: string;
}

const WASTE_ITEMS: WasteItem[] = [
  { name: "Plastic Drink Bottle", category: "recyclable", emoji: "🥤" },
  { name: "Banana Peel", category: "organic", emoji: "🍌" },
  { name: "Alkaline Battery", category: "hazardous", emoji: "🔋" },
  { name: "Corrugated Cardboard Box", category: "recyclable", emoji: "📦" },
  { name: "Half-Eaten Apple Core", category: "organic", emoji: "🍎" },
  { name: "Broken Glass Jar", category: "recyclable", emoji: "🫙" },
  { name: "Fluorescent LED Bulb", category: "hazardous", emoji: "💡" },
  { name: "Leftover Cooked Rice", category: "organic", emoji: "🍚" },
];

const QUIZ_QUESTIONS = [
  {
    question: "Which of the following foods has the highest carbon footprint per kilogram of product?",
    options: ["Chicken", "Tofu / Soy", "Beef", "Pork"],
    answer: 2,
    explanation: "Beef produces ~60kg CO₂e per kg of product, primarily due to methane emissions from enteric fermentation in cattle, which is over 6x higher than pork or chicken."
  },
  {
    question: "What percentage of carbon emissions does public transportation (bus/train) save compared to driving a solo petrol car?",
    options: ["Around 20%", "Around 45%", "Around 80%", "Around 10%"],
    answer: 2,
    explanation: "Taking public transport reduces carbon emissions by roughly 80% per passenger-kilometer compared to driving a single-occupancy vehicle."
  },
  {
    question: "Which household device usually draws the highest power (watts) and generates the largest carbon emissions when active?",
    options: ["Wi-Fi Router", "Electric Water Heater / AC", "LED television", "Refrigerator"],
    answer: 1,
    explanation: "Heating and cooling appliances (like AC, space heaters, and electric water heaters) require thousands of watts, accounting for nearly 50% of home energy footprints."
  }
];

export default function GamesView() {
  const { user, setUser } = useApp();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Waste Sorter Game State
  const [wasteIndex, setWasteIndex] = useState(0);
  const [sorterScore, setSorterScore] = useState(0);
  const [sorterFeedback, setSorterFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [sorterFinished, setSorterFinished] = useState(false);

  // Quiz Game State
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Waste Sorter handlers
  const handleSort = (bin: "recyclable" | "organic" | "hazardous") => {
    if (sorterFeedback) return;

    const currentItem = WASTE_ITEMS[wasteIndex];
    if (currentItem.category === bin) {
      setSorterScore((prev) => prev + 10);
      setSorterFeedback("correct");
    } else {
      setSorterFeedback("incorrect");
    }

    setTimeout(() => {
      setSorterFeedback(null);
      if (wasteIndex < WASTE_ITEMS.length - 1) {
        setWasteIndex((prev) => prev + 1);
      } else {
        setSorterFinished(true);
        // Credit XP / Points on complete
        if (user) {
          setUser({
            ...user,
            xp: user.xp + 40,
            eco_score: Math.min(1000, user.eco_score + 10)
          });
        }
      }
    }, 1200);
  };

  const resetSorter = () => {
    setWasteIndex(0);
    setSorterScore(0);
    setSorterFeedback(null);
    setSorterFinished(false);
  };

  // Quiz handlers
  const handleSelectOption = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || answered) return;
    setAnswered(true);

    const question = QUIZ_QUESTIONS[quizIndex];
    if (selectedOption === question.answer) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setAnswered(false);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      if (user) {
        setUser({
          ...user,
          xp: user.xp + quizScore * 20,
          eco_score: Math.min(1000, user.eco_score + quizScore * 5)
        });
      }
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setAnswered(false);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Eco Games</span>
            <span className="text-2xl animate-bounce">🎮</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">Play premium environmental mini-games, test your sustainability IQ, and earn bonus Eco Points and XP.</p>
        </div>
        
        {/* User stats widget */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm self-start">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Level {Math.floor((user?.xp || 200) / 100) || 1}</p>
            <p className="text-xs font-black text-slate-800">{user?.xp || 200} XP Accumulated</p>
          </div>
        </div>
      </div>

      {!activeGame ? (
        /* Game Selection screen */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto pt-4">
          
          {/* Game 1 Card */}
          <div className="group relative bg-white border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-emerald-950/5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 p-6 space-y-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-125" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100/50 shadow-md shadow-amber-600/5">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-800 text-base">Waste Sorter</h3>
                  <span className="bg-amber-100/70 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">+40 XP</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
                  Test your speed and eco-knowledge! Drag, match, and segregate incoming garbage items into Organic, Recyclable, and Hazardous bins. Practice rules to maintain zero pollution indices.
                </p>
              </div>
            </div>

            <button
              onClick={() => { resetSorter(); setActiveGame("sorter"); }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 active:translate-y-[2px] border-b-4 border-emerald-800 active:border-b-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Play Waste Sorter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Game 2 Card */}
          <div className="group relative bg-white border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-emerald-950/5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 p-6 space-y-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-125" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100/50 shadow-md shadow-blue-600/5">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-800 text-base">Carbon Quiz</h3>
                  <span className="bg-blue-100/70 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Up to +60 XP</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
                  Challenge your environment IQ! Answer multiple choice trivia questions about global emissions, utility reductions, transportation alternatives, and global green initiatives.
                </p>
              </div>
            </div>

            <button
              onClick={() => { resetQuiz(); setActiveGame("quiz"); }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 active:translate-y-[2px] border-b-4 border-emerald-800 active:border-b-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Play Carbon Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : activeGame === "sorter" ? (
        /* Waste Sorter Gameplay */
        <div className="bg-slate-50/50 rounded-3xl border border-slate-200/55 p-6 max-w-2xl mx-auto space-y-6 shadow-xl relative overflow-hidden">
          
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-emerald-600 animate-bounce" />
              <span>Waste Segregation Chamber</span>
            </h3>
            <button 
              onClick={() => setActiveGame(null)}
              className="text-xs font-black text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 border border-slate-100 hover:border-rose-100 px-3 py-1.5 rounded-xl transition active:scale-95"
            >
              Exit Game
            </button>
          </div>

          {!sorterFinished ? (
            <div className="space-y-6">
              
              {/* Score indicators */}
              <div className="flex justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                <span>Item {wasteIndex + 1} of {WASTE_ITEMS.length}</span>
                <span className="text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-100/50">Score: {sorterScore} pts</span>
              </div>

              {/* Active Item card - 3D visual container */}
              <div className="h-48 bg-linear-to-b from-white to-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden p-6 shadow-inner group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none" />
                
                {sorterFeedback === "correct" && (
                  <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in">
                    <CheckCircle className="w-16 h-16 animate-bounce" />
                    <span className="font-black text-lg mt-2 tracking-wide">Correct Segregation!</span>
                    <span className="font-bold text-xs opacity-90 mt-1">+10 Points</span>
                  </div>
                )}
                
                {sorterFeedback === "incorrect" && (
                  <div className="absolute inset-0 bg-rose-500/90 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-fade-in">
                    <XCircle className="w-16 h-16 animate-bounce" />
                    <span className="font-black text-lg mt-2 tracking-wide">Wrong Bin Alert!</span>
                    <span className="font-bold text-xs opacity-90 mt-1">Segments mismatched</span>
                  </div>
                )}

                {/* Floating item emoji & text */}
                <span className="text-6xl select-none filter drop-shadow-md transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {WASTE_ITEMS[wasteIndex].emoji}
                </span>
                <span className="text-xl font-black text-slate-800 tracking-tight mt-3">{WASTE_ITEMS[wasteIndex].name}</span>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Tap the correct 3D bin below</span>
              </div>

              {/* Interactive 3D Bins Grid */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                
                {/* Organic Bin */}
                <div
                  onClick={() => handleSort("organic")}
                  className={`group relative flex flex-col items-stretch transform transition-all duration-200 select-none cursor-pointer ${
                    sorterFeedback !== null ? "pointer-events-none opacity-60" : "hover:-translate-y-2 hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  {/* Bin Opening Mouth (3D top lip) */}
                  <div className="h-6 bg-amber-950/85 rounded-t-2xl border-x border-t border-amber-900 flex items-center justify-center shadow-inner relative z-10">
                    <div className="w-5/6 h-2/3 bg-black/70 rounded-full shadow-inner" />
                  </div>
                  {/* Bin Front Body (3D front panel) */}
                  <div className="h-28 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-2xl border-x-2 border-b-4 border-amber-900 text-white flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-amber-950/10 group-hover:shadow-amber-500/20">
                    <span className="text-2xl filter drop-shadow-sm mb-1">🍂</span>
                    <span className="font-black text-[10px] uppercase tracking-wider">Organic</span>
                    <span className="text-[8px] opacity-75 font-semibold mt-0.5">Compostables</span>
                  </div>
                </div>

                {/* Recyclable Bin */}
                <div
                  onClick={() => handleSort("recyclable")}
                  className={`group relative flex flex-col items-stretch transform transition-all duration-200 select-none cursor-pointer ${
                    sorterFeedback !== null ? "pointer-events-none opacity-60" : "hover:-translate-y-2 hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  {/* Bin Opening Mouth (3D top lip) */}
                  <div className="h-6 bg-blue-950/85 rounded-t-2xl border-x border-t border-blue-900 flex items-center justify-center shadow-inner relative z-10">
                    <div className="w-5/6 h-2/3 bg-black/70 rounded-full shadow-inner" />
                  </div>
                  {/* Bin Front Body (3D front panel) */}
                  <div className="h-28 bg-gradient-to-b from-blue-600 to-blue-800 rounded-b-2xl border-x-2 border-b-4 border-blue-900 text-white flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-blue-950/10 group-hover:shadow-blue-500/20">
                    <span className="text-2xl filter drop-shadow-sm mb-1">♻️</span>
                    <span className="font-black text-[10px] uppercase tracking-wider">Recycle</span>
                    <span className="text-[8px] opacity-75 font-semibold mt-0.5">Bottles & Paper</span>
                  </div>
                </div>

                {/* Hazardous Bin */}
                <div
                  onClick={() => handleSort("hazardous")}
                  className={`group relative flex flex-col items-stretch transform transition-all duration-200 select-none cursor-pointer ${
                    sorterFeedback !== null ? "pointer-events-none opacity-60" : "hover:-translate-y-2 hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  {/* Bin Opening Mouth (3D top lip) */}
                  <div className="h-6 bg-rose-950/85 rounded-t-2xl border-x border-t border-rose-900 flex items-center justify-center shadow-inner relative z-10">
                    <div className="w-5/6 h-2/3 bg-black/70 rounded-full shadow-inner" />
                  </div>
                  {/* Bin Front Body (3D front panel) */}
                  <div className="h-28 bg-gradient-to-b from-rose-600 to-rose-800 rounded-b-2xl border-x-2 border-b-4 border-rose-900 text-white flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-rose-950/10 group-hover:shadow-rose-500/20">
                    <span className="text-2xl filter drop-shadow-sm mb-1">⚠️</span>
                    <span className="font-black text-[10px] uppercase tracking-wider">Hazard</span>
                    <span className="text-[8px] opacity-75 font-semibold mt-0.5">Chemicals & Tech</span>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Finished Sorter */
            <div className="text-center p-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-amber-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-amber-500/20 mx-auto transform hover:rotate-12 duration-300">
                <Award className="w-10 h-10 filter drop-shadow-sm" />
              </div>
              
              <div>
                <h4 className="font-black text-slate-800 text-xl tracking-tight">Segregation Completed!</h4>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Outstanding work. You segregated all trash items correctly!</p>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 max-w-sm mx-auto flex justify-between items-center text-xs font-black text-slate-700 shadow-sm">
                <span>Final Score:</span>
                <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">{sorterScore} pts / 80 max</span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 max-w-sm mx-auto text-emerald-800 text-xs font-bold flex items-center gap-2 justify-center">
                <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
                <span>Rewards: +40 XP & +10 Eco Points Added!</span>
              </div>

              <div className="flex gap-3 max-w-sm mx-auto">
                <button
                  onClick={resetSorter}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setActiveGame(null)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition active:scale-95 border-b-4 border-emerald-800 active:border-b-0 cursor-pointer"
                >
                  Back to Hub
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Carbon Quiz Gameplay - Holographic Retro Sci-Fi Terminal */
        <div className="bg-slate-950 rounded-3xl border-2 border-emerald-500/40 p-6 max-w-2xl mx-auto space-y-6 shadow-2xl shadow-emerald-500/10 relative overflow-hidden text-emerald-300">
          {/* Scanline line overlay */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400/25 opacity-30 shadow-[0_0_15px_rgba(52,211,153,1)] z-20 animate-pulse pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04),transparent_80%)] pointer-events-none" />

          <div className="flex justify-between items-center border-b border-emerald-500/20 pb-4">
            <h3 className="font-mono font-black text-emerald-400 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <span className="tracking-widest uppercase text-sm font-bold">Carbon Trivia Terminal v1.0</span>
            </h3>
            <button 
              onClick={() => setActiveGame(null)}
              className="font-mono text-[10px] font-black text-emerald-500 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition active:scale-95 cursor-pointer"
            >
              SHUTDOWN
            </button>
          </div>

          {!quizFinished ? (
            <div className="space-y-5">
              
              {/* Stats telemetry */}
              <div className="flex justify-between font-mono text-[10px] font-black text-emerald-500/80 uppercase tracking-widest px-1">
                <span>QUESTION ID: 0{quizIndex + 1}_OF_0{QUIZ_QUESTIONS.length}</span>
                <span>TELEMETRY_SCORE: {quizScore} / {QUIZ_QUESTIONS.length}</span>
              </div>

              {/* Question Text */}
              <div className="bg-slate-900/80 border border-emerald-500/20 p-5 rounded-2xl">
                <h4 className="font-sans font-black text-white text-sm leading-relaxed">
                  {QUIZ_QUESTIONS[quizIndex].question}
                </h4>
              </div>

              {/* Options list */}
              <div className="space-y-3 pt-1">
                {QUIZ_QUESTIONS[quizIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  const isCorrectAnswer = QUIZ_QUESTIONS[quizIndex].answer === oIdx;

                  let borderClass = "border-emerald-500/25 bg-slate-950 text-emerald-400 hover:bg-emerald-950/60 hover:border-emerald-400/50";
                  if (answered) {
                    if (isCorrectAnswer) {
                      borderClass = "border-emerald-400 bg-emerald-950/50 text-emerald-200 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.25)]";
                    } else if (isSelected) {
                      borderClass = "border-rose-500 bg-rose-950/30 text-rose-300";
                    } else {
                      borderClass = "border-emerald-500/10 opacity-30 pointer-events-none";
                    }
                  } else if (isSelected) {
                    borderClass = "border-emerald-400 bg-emerald-950/40 text-emerald-100 ring-2 ring-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                  }

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`font-mono p-4 border rounded-2xl cursor-pointer text-xs font-semibold tracking-wide transition-all duration-150 active:scale-99 ${borderClass}`}
                    >
                      <span className="text-[10px] text-emerald-500/60 mr-2 font-mono">{String.fromCharCode(65 + oIdx)})</span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation section on answer */}
              {answered && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl space-y-1.5 animate-fade-in">
                  <div className="text-[9px] font-black text-emerald-400 tracking-wider flex items-center gap-1.5 uppercase font-mono">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>SYSTEM_FACT_ANALYSIS:</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 font-sans leading-relaxed font-semibold">
                    {QUIZ_QUESTIONS[quizIndex].explanation}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex justify-end font-mono">
                {!answered ? (
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={selectedOption === null}
                    className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-emerald-900 disabled:border-emerald-900 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-400/20 transition-all border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[2px] cursor-pointer"
                  >
                    SUBMIT ANSWER
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuiz}
                    className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[2px] animate-fade-in cursor-pointer"
                  >
                    <span>{quizIndex < QUIZ_QUESTIONS.length - 1 ? "NEXT_QUESTION >>" : "CALCULATE_RESULTS >>"}</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Finished Quiz screen */
            <div className="text-center p-6 space-y-6 animate-fade-in font-mono">
              <div className="w-20 h-20 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center border-2 border-emerald-400 shadow-xl shadow-emerald-500/15 mx-auto transform hover:rotate-12 duration-300">
                <Award className="w-10 h-10 filter drop-shadow-sm" />
              </div>
              
              <div>
                <h4 className="font-mono font-black text-emerald-300 text-lg tracking-widest uppercase">Quiz Evaluation Complete</h4>
                <p className="text-xs text-emerald-500/80 mt-1 font-sans font-semibold">Your responses have been processed through EcoSphere AI logic modules.</p>
              </div>

              <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 max-w-sm mx-auto flex justify-between items-center text-xs font-black text-emerald-300 shadow-inner">
                <span>ACCURACY RATE:</span>
                <span className="text-emerald-300 bg-emerald-950 border border-emerald-500/30 px-3 py-1 rounded-xl">
                  {Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}% ({quizScore} / {QUIZ_QUESTIONS.length})
                </span>
              </div>

              <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-2xl p-4 max-w-sm mx-auto text-emerald-400 text-xs font-black flex items-center gap-2 justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>REWARD CREDITED: +{quizScore * 20} XP & +{quizScore * 5} ECO SCORE</span>
              </div>

              <div className="flex gap-3 max-w-sm mx-auto font-mono">
                <button
                  onClick={resetQuiz}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-500/30 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RETRY MODULE</span>
                </button>
                <button
                  onClick={() => setActiveGame(null)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all border-b-4 border-emerald-700 active:border-b-0 active:translate-y-[2px] cursor-pointer"
                >
                  EXIT TERMINAL
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
