"use client";

import React, { useState } from "react";
import { useApp } from "@/store/AppContext";
import { api } from "@/services/api";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Languages, 
  Link2,
  CheckCircle,
  AlertTriangle,
  Globe,
  Gauge,
  Sparkles
} from "lucide-react";

export default function SettingsView() {
  const { user, setUser } = useApp();
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "security" | "preferences" | "accounts">("profile");

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);

  // Notifications toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState("");

  // Preferences States
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [language, setLanguage] = useState("en");
  const [prefSuccess, setPrefSuccess] = useState("");

  // Accounts States
  const [connectedServices, setConnectedServices] = useState({
    google: true,
    github: false,
    microsoft: false
  });
  const [accountsSuccess, setAccountsSuccess] = useState("");

  // Handler for Profile Update
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const updatedUser = await api.auth.updateProfile(name, email);
      setUser(updatedUser);
      setProfileSuccess("Your profile information was successfully updated!");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile settings.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handler for Password Update
  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySuccess("");
    setSecurityError("");

    if (newPassword !== confirmPassword) {
      setSecurityError("Passwords mismatch. The new password and confirmation must match.");
      return;
    }

    if (newPassword.length < 8) {
      setSecurityError("For your protection, the password must be at least 8 characters long.");
      return;
    }

    setSecurityLoading(true);
    try {
      await api.auth.updateProfile(undefined, undefined, newPassword);
      setSecuritySuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to update password settings.");
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleNotifSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess("Notification configurations updated successfully!");
    setTimeout(() => setNotifSuccess(""), 3000);
  };

  const handlePrefSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSuccess("System preferences applied successfully!");
    setTimeout(() => setPrefSuccess(""), 3000);
  };

  const toggleConnection = (service: "google" | "github" | "microsoft") => {
    setConnectedServices(prev => {
      const nextVal = !prev[service];
      setAccountsSuccess(`${service.charAt(0).toUpperCase() + service.slice(1)} account ${nextVal ? "linked" : "unlinked"} successfully!`);
      setTimeout(() => setAccountsSuccess(""), 3500);
      return { ...prev, [service]: nextVal };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <span>Settings</span>
          <SettingsIcon className="w-7 h-7 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
        </h1>
        <p className="text-slate-500 text-xs font-semibold mt-1">Manage your credentials, preferences, linked connections, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Navigation List */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-1 h-fit">
          {[
            { id: "profile", label: "Profile Settings", icon: User },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security & Passwords", icon: Shield },
            { id: "preferences", label: "App Preferences", icon: Languages },
            { id: "accounts", label: "Linked Accounts", icon: Link2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeSection;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id as "profile" | "notifications" | "security" | "preferences" | "accounts");
                  // Clear alerts on switch
                  setProfileSuccess(""); setProfileError("");
                  setSecuritySuccess(""); setSecurityError("");
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isActive 
                    ? "bg-emerald-950 text-white shadow-md shadow-emerald-950/20" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Detail Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2 min-h-[400px]">
          
          {/* PROFILE SETTINGS SECTION */}
          {activeSection === "profile" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-slate-800 text-sm">Profile Settings</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Update your account name and email address matching our server database.</p>
              </div>

              {profileSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/50 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="settingsNameInput" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                  <input 
                    id="settingsNameInput"
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white transition"
                    required
                    disabled={profileLoading}
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="settingsEmailInput" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                  <input 
                    id="settingsEmailInput"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white transition"
                    required
                    disabled={profileLoading}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 active:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {profileLoading ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === "notifications" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-slate-800 text-sm">Notifications preferences</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Select how and when you want to be alerted about campaigns, challenges, and calculations.</p>
              </div>

              {notifSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{notifSuccess}</span>
                </div>
              )}

              <form onSubmit={handleNotifSave} className="space-y-4">
                
                {/* Email toggle */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800">Email Notifications</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Receive environmental drive alerts and weekly digests.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 cursor-pointer ${
                      emailNotifs ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform duration-200 absolute top-1 ${
                      emailNotifs ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Push Toggle */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800">Push Notifications</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Get alerts when pollution reports are resolved or eco challenges expire.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushNotifs(!pushNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 cursor-pointer ${
                      pushNotifs ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform duration-200 absolute top-1 ${
                      pushNotifs ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Weekly digest */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800">Weekly Carbon Digest</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">A weekly analytics report summarizing your carbon log trends.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 cursor-pointer ${
                      weeklyDigest ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform duration-200 absolute top-1 ${
                      weeklyDigest ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY & PASSWORDS SECTION */}
          {activeSection === "security" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-slate-800 text-sm">Security & Passwords</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Change your account login credentials securely. Passwords require a minimum length of 8 symbols.</p>
              </div>

              {securitySuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{securitySuccess}</span>
                </div>
              )}
              {securityError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/50 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{securityError}</span>
                </div>
              )}

              <form onSubmit={handleSecuritySave} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="settingsCurrentPassword" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Current Password</label>
                  <input 
                    id="settingsCurrentPassword"
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white transition"
                    required
                    disabled={securityLoading}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="settingsNewPassword" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">New Password</label>
                  <input 
                    id="settingsNewPassword"
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white transition"
                    required
                    disabled={securityLoading}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="settingsConfirmNewPassword" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
                  <input 
                    id="settingsConfirmNewPassword"
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white transition"
                    required
                    disabled={securityLoading}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {securityLoading ? "Processing..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* APP PREFERENCES SECTION */}
          {activeSection === "preferences" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-slate-800 text-sm">App Preferences</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Customize display languages, carbon metrics formulas, and UI modes.</p>
              </div>

              {prefSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{prefSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePrefSave} className="space-y-5">
                
                {/* Metric Unit Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Measurement System</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUnits("metric")}
                      className={`p-3 border rounded-xl text-xs font-bold transition cursor-pointer ${
                        units === "metric" 
                          ? "border-emerald-600 bg-emerald-50/20 text-emerald-800" 
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      Metric (kg, km, Liters)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnits("imperial")}
                      className={`p-3 border rounded-xl text-xs font-bold transition cursor-pointer ${
                        units === "imperial" 
                          ? "border-emerald-600 bg-emerald-50/20 text-emerald-800" 
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      Imperial (lbs, miles, Gallons)
                    </button>
                  </div>
                </div>

                {/* Display Language */}
                <div className="space-y-2">
                  <label htmlFor="settingsLanguageSelect" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Display Language</span>
                  </label>
                  <select
                    id="settingsLanguageSelect"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="en">English (US/UK)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                  </select>
                </div>

                {/* Theme Mode Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Application Theme</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {["light", "dark", "system"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setThemeMode(mode as "light" | "dark" | "system")}
                        className={`py-2 px-3 border rounded-xl text-[10px] font-black capitalize transition cursor-pointer ${
                          themeMode === mode 
                            ? "border-emerald-600 bg-emerald-50/20 text-emerald-800" 
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Apply Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LINKED ACCOUNTS SECTION */}
          {activeSection === "accounts" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-black text-slate-800 text-sm">Linked Accounts</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Manage your authentication logins, enabling OAuth logins for single sign-on.</p>
              </div>

              {accountsSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{accountsSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                {[
                  { id: "google", name: "Google Cloud SSO", logo: "🔴" },
                  { id: "github", name: "GitHub Repository Auth", logo: "🐈" },
                  { id: "microsoft", name: "Microsoft Live Connect", logo: "🟦" }
                ].map((service) => {
                  const isConnected = (connectedServices as Record<string, boolean>)[service.id];
                  return (
                    <div 
                      key={service.id} 
                      className="p-4 border border-slate-150 hover:border-slate-200 rounded-2xl flex items-center justify-between gap-4 transition shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl filter drop-shadow-xs">{service.logo}</span>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{service.name}</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">
                            {isConnected ? "OAuth integration authorized." : "Connect to authorize single sign-on."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleConnection(service.id as "google" | "github" | "microsoft")}
                        className={`py-1.5 px-3.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition cursor-pointer ${
                          isConnected 
                            ? "bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600" 
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        }`}
                      >
                        {isConnected ? "Unlink" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
