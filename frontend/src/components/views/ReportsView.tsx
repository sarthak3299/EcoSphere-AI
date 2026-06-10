"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/store/AppContext";
import { api } from "@/services/api";
import { 
  Camera, 
  MapPin, 
  AlertTriangle, 
  Building2, 
  PhoneCall, 
  Loader2, 
  CheckCircle,
  Clock,
  UserCheck,
  ShieldCheck,
  FileImage
} from "lucide-react";

const AUTHORITIES = [
  { name: "Pollution Control Board", dept: "State Environment Office", contact: "info@pcb.gov.in" },
  { name: "Municipal Corporation", dept: "Waste & Sanitation Dept", contact: "complaints@municipal.org" },
  { name: "Forest Department", dept: "Flora & Wildlife Protection", contact: "helpdesk@forest.gov.in" },
  { name: "Emergency Helpline", dept: "Immediate Hazardous Spills", contact: "1800-456-9000", isCall: true }
];

export default function ReportsView() {
  const { refreshData } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  
  // Form input state
  const [locationText, setLocationText] = useState("");
  const [category, setCategory] = useState("Garbage Dumping");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // UI Loading States
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [resolvingReport, setResolvingReport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const fetchReports = async () => {
    setLoadingList(true);
    try {
      const data = await api.incident.getAll();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error("Failed to load incidents list:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseMyLocation = () => {
    setLocationText("Koramangala, Bengaluru, Karnataka, India");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate GPS coordinates
    const lat = 12.9352 + (Math.random() - 0.5) * 0.04;
    const lng = 77.6245 + (Math.random() - 0.5) * 0.04;

    try {
      const newReport = await api.incident.report(
        locationText,
        category,
        description,
        severity,
        imagePreview || undefined,
        lat,
        lng
      );
      
      alert(`Report submitted successfully! Assigned to: ${newReport.authority}. You received 15 Eco Points and 50 XP!`);
      
      // Reset form
      setLocationText("");
      setDescription("");
      setSeverity("Medium");
      setImageFile(null);
      setImagePreview(null);
      
      // Refresh
      await refreshData();
      await fetchReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to file incident report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReport = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      const result = await api.incident.verify(selectedReport.id);
      alert(result.message);
      await refreshData();
      await fetchReports();
      setSelectedReport((prev: any) => prev ? { ...prev, status: result.status } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to verify report");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrganizeEvent = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const title = `Community Cleanup: ${selectedReport.category}`;
      const desc = `Join us in resolving this reported incident: ${selectedReport.description || 'No description provided'}. We will meet at the location to clear the hazard. Bring gloves and positive energy!`;
      const organizer = "EcoSphere Volunteer";
      const dateStr = tomorrow.toISOString();
      const locationText = selectedReport.location_text;
      const lat = selectedReport.latitude;
      const lng = selectedReport.longitude;
      const imageUrl = selectedReport.image_url;

      await api.events.create(
        title,
        desc,
        organizer,
        dateStr,
        locationText,
        lat,
        lng,
        imageUrl
      );

      alert(`Cleanup event "${title}" organized successfully! You can find it listed under the Events tab. Let's make our neighborhood cleaner!`);
      await refreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create cleanup event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;
    setResolvingReport(true);
    try {
      const result = await api.incident.resolve(selectedReport.id, proofImage || undefined);
      alert(result.message);
      setShowResolveModal(false);
      setProofImage(null);
      await refreshData();
      await fetchReports();
      setSelectedReport((prev: any) => prev ? { ...prev, status: "Resolved", image_url: proofImage || prev.image_url } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve report");
    } finally {
      setResolvingReport(false);
    }
  };

  // Timeline render helper
  const renderTimeline = (statusVal: string) => {
    const steps = [
      { id: "Submitted", label: "Report Submitted", desc: "Report filed and recorded in the database.", icon: Clock },
      { id: "Under Review", label: "Under Review", desc: "Department evaluating category, image validity and coordinates.", icon: ShieldCheck },
      { id: "Assigned", label: "Assigned to Authority", desc: "Assigned directly to local jurisdiction for correction.", icon: Building2 },
      { id: "Action Initiated", label: "Action Initiated", desc: "Ground dispatch team sent to inspect and resolve.", icon: UserCheck },
      { id: "Resolved", label: "Resolved", desc: "Dumping site cleared or pollution corrected.", icon: CheckCircle },
    ];

    const getStepIndex = (s: string) => {
      const idx = steps.findIndex((step) => step.id === s);
      return idx !== -1 ? idx : 0;
    };

    const currentIdx = getStepIndex(statusVal);

    return (
      <div className="relative pl-6 space-y-6">
        {/* Vertical Line indicator */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-100" />

        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative flex gap-4 text-xs">
              {/* Dot Icon Indicator */}
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border transition ${
                isDone 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-white border-slate-200 text-slate-400"
              }`}>
                <StepIcon className="w-3 h-3" />
              </div>

              <div className="flex-1 min-w-0">
                <h5 className={`font-bold ${isCurrent ? "text-emerald-700" : isDone ? "text-slate-700" : "text-slate-400"}`}>
                  {step.label}
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
      
      {/* Left Column: Submission Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Report an Environmental Issue</h2>
          <p className="text-xs text-slate-400 mt-1">Submit pictures of pollution, hazardous waste, or garbage dumping to local authorities.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Photo upload container */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Upload Photos</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/10 rounded-2xl p-5 text-center cursor-pointer transition relative"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="flex items-center justify-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">Photo Attached</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Click to replace image file</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-600 block">Select photo from library or camera</span>
                  <span className="text-[10px] text-slate-400 block">Supports JPEG, PNG, or SVG</span>
                </div>
              )}
            </div>
          </div>

          {/* Location field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 flex justify-between">
              <span>Location Coordinates</span>
              <button 
                type="button" 
                onClick={handleUseMyLocation}
                className="text-emerald-700 hover:underline flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Use My Location</span>
              </button>
            </label>
            <input 
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Enter street address, city, or coordinates..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700"
              required
            />
          </div>

          {/* Category selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Hazard Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700"
            >
              <option value="Garbage Dumping">Garbage Dumping</option>
              <option value="Air Pollution">Air Pollution</option>
              <option value="Water Pollution">Water Pollution</option>
              <option value="Plastic Waste">Plastic Waste</option>
              <option value="Other">Other Environmental Spills</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Description Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context (e.g. garbage accumulating next to residential area, foul smell)..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-sm font-semibold text-slate-700 resize-none"
            />
          </div>

          {/* Severity toggle */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Severity Level</label>
            <div className="grid grid-cols-3 gap-2">
              {["Low", "Medium", "High"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    severity === level 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Submit Report</span>
          </button>
        </form>

      </div>

      {/* Right Column: Authorities & Status Timeline */}
      <div className="space-y-6">
        
        {/* Authority Connect Cards list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Connect with Authorities</h3>
          <div className="space-y-2.5">
            {AUTHORITIES.map((auth, idx) => (
              <div key={idx} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800">{auth.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{auth.dept}</p>
                </div>
                {auth.isCall ? (
                  <a 
                    href={`tel:${auth.contact}`}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                ) : (
                  <a
                    href={`mailto:${auth.contact}`}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <span>Contact</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* My Reports Tracking list */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">My Report Status</h3>
          
          {loadingList ? (
            <div className="flex justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {/* Reports list slider / select */}
              <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                {reports.map((r) => {
                  const isSelected = selectedReport?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold shrink-0 transition ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Report #{r.id} ({r.category})
                    </button>
                  );
                })}
              </div>

              {/* Selected report information */}
              {selectedReport && (
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4 animate-fade-in">
                  
                  <div className="flex gap-4">
                    {selectedReport.image_url ? (
                      <img 
                        src={selectedReport.image_url} 
                        alt="Report attachment" 
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                        <FileImage className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-700">Report #{selectedReport.id}</span>
                        <span className="bg-emerald-50 text-emerald-700 font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                          {selectedReport.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Location: {selectedReport.location_text}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned Authority: {selectedReport.authority}</p>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Closed-loop action controls */}
                  {selectedReport.status !== "Resolved" && (
                    <div className="flex flex-wrap gap-2 py-1">
                      <button
                        type="button"
                        onClick={handleVerifyReport}
                        disabled={actionLoading}
                        className="flex-1 min-w-[100px] py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "👍 Verify Hazard (+5)"}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleOrganizeEvent}
                        disabled={actionLoading}
                        className="flex-1 min-w-[100px] py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "🧹 Organize Cleanup"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowResolveModal(true)}
                        className="flex-1 min-w-[100px] py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        ✨ Submit Proof (+40)
                      </button>
                    </div>
                  )}

                  <hr className="border-slate-100" />
                  
                  {/* Timeline */}
                  {renderTimeline(selectedReport.status)}

                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs font-medium">
              No reports filed yet. Report an environmental incident to track updates here.
            </div>
          )}
        </div>

      </div>

      {/* Resolve Proof Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl animate-fade-in space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">Submit Cleanup Proof</h3>
              <p className="text-xs text-slate-400 mt-1">Upload a photo of the cleaned site to resolve this report and earn Eco Points + XP.</p>
            </div>

            <div 
              onClick={() => proofInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/10 rounded-2xl p-5 text-center cursor-pointer transition relative"
            >
              <input 
                type="file" 
                ref={proofInputRef}
                accept="image/*"
                onChange={handleProofImageChange}
                className="hidden"
              />
              
              {proofImage ? (
                <div className="flex items-center justify-center gap-3">
                  <img src={proofImage} alt="Proof Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-700 block">Before & After Photo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Click to replace photo</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-600 block">Select cleanup completion photo</span>
                  <span className="text-[10px] text-slate-400 block">Required to claim points</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowResolveModal(false); setProofImage(null); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveReport}
                disabled={resolvingReport || !proofImage}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                {resolvingReport && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Upload & Resolve</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
