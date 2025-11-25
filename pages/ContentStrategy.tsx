import React, { useEffect, useState } from 'react';
import { TrendingUp, Plus, ArrowRight, Save, Loader2, Target, Globe, Clock, BarChart, Info } from 'lucide-react';
import { StrategyProfile, Trend } from '../types';

const ContentStrategy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRENDS' | 'PROFILE'>('PROFILE');
  const [profile, setProfile] = useState<StrategyProfile | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profRes, trendsRes] = await Promise.all([
             fetch('/api/strategy?userId=demo'),
             fetch('/api/trends?userId=demo')
        ]);
        
        if (profRes.ok) setProfile(await profRes.json());
        if (trendsRes.ok) setTrends(await trendsRes.json());
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
        // Backend expects userId in query or body. Adding to query for safety.
        const res = await fetch('/api/strategy?userId=demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'demo', profile })
        });
        
        if (res.ok) {
            setSaveMessage('Profile saved successfully');
            setTimeout(() => setSaveMessage(null), 3000);
        } else {
            throw new Error('Save failed');
        }
    } catch (e) {
        setSaveMessage('Error saving profile');
    } finally {
        setIsSaving(false);
    }
  };

  const updateProfile = (field: keyof StrategyProfile, value: any) => {
    if (profile) {
        setProfile({ ...profile, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Strategy & Trends</h1>
          <p className="text-slate-400">Configure channel DNA and monitor market movements</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
                onClick={() => setActiveTab('PROFILE')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'PROFILE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                Strategy Profile
            </button>
            <button
                onClick={() => setActiveTab('TRENDS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'TRENDS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                Market Trends
            </button>
        </div>
      </div>

      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target className="text-indigo-400" size={20} />
                        Channel DNA
                    </h3>
                    <div className="flex items-center gap-3">
                        {saveMessage && (
                            <span className={`text-xs font-medium ${saveMessage.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                                {saveMessage}
                            </span>
                        )}
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : profile && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Core Niche</label>
                                <input 
                                    type="text" 
                                    value={profile.niche}
                                    onChange={(e) => updateProfile('niche', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                    <Info size={10} /> Defines the primary search scope for the Trend Agent.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Brand Tone</label>
                                <input 
                                    type="text" 
                                    value={profile.tone}
                                    onChange={(e) => updateProfile('tone', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                    <Info size={10} /> Influences script style and voiceover emotion.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                                    <Clock size={16} /> Daily Output Goals
                                </label>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-300">Long Form Videos</span>
                                        <input 
                                            type="number" 
                                            value={profile.videosPerDay}
                                            onChange={(e) => updateProfile('videosPerDay', parseInt(e.target.value))}
                                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-300">Shorts</span>
                                        <input 
                                            type="number" 
                                            value={profile.shortsPerDay}
                                            onChange={(e) => updateProfile('shortsPerDay', parseInt(e.target.value))}
                                            className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                                    <Globe size={16} /> Localization
                                </label>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs text-slate-500 block mb-1">Language</span>
                                        <select 
                                            value={profile.language}
                                            onChange={(e) => updateProfile('language', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-indigo-500"
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="de">German (DE)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500 block mb-1">Timezone</span>
                                        <input 
                                            type="text" 
                                            value={profile.timezone}
                                            onChange={(e) => updateProfile('timezone', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Content Pillars (Comma separated)</label>
                            <textarea
                                value={profile.contentPillars.join(', ')}
                                onChange={(e) => updateProfile('contentPillars', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                placeholder="e.g. AI News, Tutorials, Tool Reviews"
                            />
                             <p className="text-[10px] text-slate-500 mt-1">
                                Used by the Agent to categorize new topics and balance the content calendar.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                 <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Orchestrator Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-sm text-slate-300">Profile Sync</span>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">Active</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-sm text-slate-300">Schedule Optimization</span>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">AI Enabled</span>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Changes to the strategy profile will immediately influence the next hourly run of the Autonomous Agent. Adjusting niche or tone will regenerate upcoming video concepts.
                        </p>
                    </div>
                 </div>
            </div>
        </div>
      )}

      {activeTab === 'TRENDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                     <h3 className="text-lg font-semibold text-white">Live Market Data</h3>
                     <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded">Source: YouTube Data API</span>
                </div>
               
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                                <th className="p-4 font-medium">Topic</th>
                                <th className="p-4 font-medium">Category</th>
                                <th className="p-4 font-medium">Relevance</th>
                                <th className="p-4 font-medium">Potential</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {trends.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-500">
                                    {isLoading ? "Scanning trends..." : "No active trends found."}
                                </td></tr>
                            ) : trends.map((trend) => (
                                <tr key={trend.id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-200 font-medium">{trend.topic}</span>
                                            {trend.isBreaking && (
                                                <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20 uppercase">
                                                    Breaking
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-slate-400 text-sm bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                            {trend.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${trend.relevance > 90 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                    style={{ width: `${trend.relevance}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-400">{trend.relevance}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            trend.growthPotential === 'High' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {trend.growthPotential}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-white mb-2">Trend Insights</h3>
                 <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        The autonomous agent prioritizes topics marked as <strong>High Growth Potential</strong> and <strong>Breaking News</strong>. 
                        It cross-references these with your "Channel DNA" to ensure brand consistency.
                    </p>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ContentStrategy;