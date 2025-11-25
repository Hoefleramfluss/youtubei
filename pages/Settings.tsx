
import React, { useEffect, useState } from 'react';
import { Save, Loader2, ShieldCheck, Database, Key, Globe, Clock, Server } from 'lucide-react';
import { UiConfigSummary } from '../types';

const SettingsPage: React.FC = () => {
  const [summary, setSummary] = useState<UiConfigSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [geminiKey, setGeminiKey] = useState('');
  const [mediaBucket, setMediaBucket] = useState('');
  const [veoModel, setVeoModel] = useState('');
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [timezone, setTimezone] = useState('');

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config/ui-summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        // Pre-fill non-secret fields
        setVeoModel(data.veoModelName || 'veo-3.1-fast-generate-preview');
        setLanguage(data.defaultLanguage || 'en');
        setTimezone(data.defaultTimezone || 'Europe/Berlin');
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        defaultLanguage: language,
        defaultTimezone: timezone,
        veoModelName: veoModel,
      };

      // Only send keys if user entered something
      if (geminiKey) payload.geminiApiKey = geminiKey;
      if (mediaBucket) payload.mediaBucket = mediaBucket;

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newSummary = await res.json();
        setSummary(newSummary);
        setGeminiKey(''); // Clear secret input
        setMediaBucket(''); // Clear secret input if treated as secret, mostly convenience
        alert("System configuration updated successfully.");
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">System Settings</h1>
        <p className="text-slate-400">Configure global API keys and infrastructure defaults.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Server size={20} className="text-indigo-400"/> System Status
          </h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-sm text-slate-300">Gemini AI Engine</span>
                {summary?.hasGeminiKey ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <ShieldCheck size={12}/> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                    Missing Key
                  </span>
                )}
             </div>
             <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-sm text-slate-300">Media Storage (GCS)</span>
                {summary?.hasMediaBucket ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <Database size={12}/> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                    Not Configured
                  </span>
                )}
             </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:col-span-2">
           <h3 className="text-lg font-semibold text-white mb-6">Configuration</h3>
           
           <div className="space-y-6">
             {/* Gemini */}
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                 <Key size={16}/> Gemini API Key
               </label>
               <input 
                 type="password" 
                 value={geminiKey}
                 onChange={(e) => setGeminiKey(e.target.value)}
                 placeholder={summary?.hasGeminiKey ? "•••••••••••••••• (Stored Securely)" : "Enter Gemini API Key"}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
               />
               <p className="text-[10px] text-slate-500 mt-1">Required for Trend Analysis, Scripting, and Veo 3 Video Generation.</p>
             </div>

             {/* Veo Model */}
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Veo Model Name</label>
                <input 
                 type="text" 
                 value={veoModel}
                 onChange={(e) => setVeoModel(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
               />
               <p className="text-[10px] text-slate-500 mt-1">Default: veo-3.1-fast-generate-preview</p>
             </div>

             {/* Storage */}
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                 <Database size={16}/> Media Bucket Name
               </label>
               <input 
                 type="text" 
                 value={mediaBucket}
                 onChange={(e) => setMediaBucket(e.target.value)}
                 placeholder={summary?.hasMediaBucket ? "Configured (Enter new to overwrite)" : "e.g. my-ai-channel-assets"}
                 className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
               />
               <p className="text-[10px] text-slate-500 mt-1">Google Cloud Storage bucket for saving generated audio/video assets.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                     <Globe size={16}/> Default Language
                   </label>
                   <select 
                     value={language}
                     onChange={(e) => setLanguage(e.target.value as any)}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                     <option value="en">English (US)</option>
                     <option value="de">German (DE)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                     <Clock size={16}/> Default Timezone
                   </label>
                   <input 
                     type="text" 
                     value={timezone}
                     onChange={(e) => setTimezone(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
                </div>
             </div>
           </div>

           <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? 'Saving System Config...' : 'Save Configuration'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
