
import React, { useState, useEffect } from 'react';
import { Users, Eye, PlayCircle, Clock, CheckCircle2, Circle, AlertCircle, Youtube, Loader2, ShieldCheck, Zap, Power } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { INITIAL_STATS, GROWTH_DATA } from '../constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DailyStats } from '../types';

const Dashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stats, setStats] = useState<DailyStats>(INITIAL_STATS);
  
  // Automation State
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [isTogglingAuto, setIsTogglingAuto] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // Helper to check query params for success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check connection status & stats
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Auth Status
        const authRes = await fetch('/api/auth/youtube/status?userId=demo');
        if (authRes.ok) {
          const data = await authRes.json();
          setIsConnected(data.connected);
        }

        // 2. Automation Settings
        const autoRes = await fetch('/api/automation?userId=demo');
        if (autoRes.ok) {
            const data = await autoRes.json();
            setIsAutomationEnabled(data.enabled);
        }

        // 3. Analytics (if connected)
        const statsRes = await fetch('/api/analytics/summary?userId=demo');
        if (statsRes.ok) {
            const data = await statsRes.json();
            setStats(data);
        }
      } catch (error) {
        console.error('Failed to init dashboard:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    initData();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/auth/youtube/url?userId=demo');
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error initiating connection:', error);
      setIsConnecting(false);
    }
  };

  const toggleAutomation = async () => {
      if (!isConnected) return;
      setIsTogglingAuto(true);
      const newState = !isAutomationEnabled;
      try {
          await fetch('/api/automation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: 'demo', enabled: newState })
          });
          setIsAutomationEnabled(newState);
      } catch (e) {
          console.error("Failed to toggle automation", e);
      } finally {
          setIsTogglingAuto(false);
      }
  };

  const handleManualTrigger = async () => {
      setIsTriggering(true);
      try {
          await fetch('/api/agent/runHourly?userId=demo', { method: 'POST' });
          // In a real app, maybe redirect to monitor or show toast
          alert("Autonomous Cycle Started! Check the Live Monitor tab.");
      } catch(e) {
          console.error("Trigger failed", e);
      } finally {
          setIsTriggering(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1">Mission Control</h1>
            <p className="text-slate-400">Daily Operations & Channel Health</p>
        </div>
        
        {/* Connection Status Widget */}
        <div className={`flex items-center gap-4 px-4 py-2 rounded-xl border transition-all ${
            isConnected ? 'bg-indigo-900/30 border-indigo-500/30' : 'bg-slate-800 border-slate-700'
        }`}>
            {isCheckingStatus ? (
               <div className="flex items-center gap-2 text-slate-400">
                 <Loader2 size={16} className="animate-spin" />
                 <span className="text-sm">Checking status...</span>
               </div>
            ) : isConnected ? (
                <>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <div className="flex flex-col">
                            <span className="text-indigo-300 text-sm font-bold">Connected</span>
                            <span className="text-xs text-indigo-400/70">OAuth Valid</span>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-indigo-500/30 mx-2"></div>
                    <div className="text-xs text-indigo-300">
                        Channel ID: <span className="font-mono text-white">UC_DEMO...</span>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">Channel Disconnected</span>
                    <button 
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Youtube size={16} />}
                        {isConnecting ? 'Redirecting...' : 'Connect YouTube'}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Control Deck */}
      {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Automation Toggle */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${isAutomationEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                          <Power size={24} />
                      </div>
                      <div>
                          <h3 className="text-white font-semibold">Autonomous Mode</h3>
                          <p className="text-xs text-slate-400">
                              {isAutomationEnabled ? 'Agent is scheduling hourly cycles.' : 'Agent is paused. Manual triggers only.'}
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={toggleAutomation}
                    disabled={isTogglingAuto}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutomationEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutomationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>

              {/* Manual Trigger */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                       <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400">
                          <Zap size={24} />
                      </div>
                      <div>
                          <h3 className="text-white font-semibold">Manual Override</h3>
                          <p className="text-xs text-slate-400">Force immediate content cycle.</p>
                      </div>
                  </div>
                  <button 
                    onClick={handleManualTrigger}
                    disabled={isTriggering}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                      {isTriggering ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                      Run Cycle Now
                  </button>
              </div>
          </div>
      )}

      {!isConnected && !isCheckingStatus && (
        <div className="bg-amber-900/20 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
                <h4 className="text-amber-200 font-bold text-sm">Action Required: Connect Account</h4>
                <p className="text-amber-200/70 text-sm mt-1">
                    Please connect your YouTube account to enable auto-uploads, analytics syncing, and Veo 3 publishing. 
                    <span className="block mt-1 text-xs text-amber-500/70 flex items-center gap-1">
                      <ShieldCheck size={12}/> Grants permissions: Upload, Analytics, Audit.
                    </span>
                </p>
            </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
        <MetricCard 
          title="Subscribers" 
          value={stats.subscribers.toLocaleString()} 
          target={stats.subsGoal.toString()}
          change={12.5}
          trend="up"
          icon={<Users size={20} />} 
        />
        <MetricCard 
          title="Avg. VTR (Retention)" 
          value={`${stats.vtr}%`} 
          change={2.1} 
          trend="up"
          icon={<Clock size={20} />} 
        />
        <MetricCard 
          title="Total Views (28d)" 
          value={stats.impressions ? (stats.impressions / 2).toLocaleString() : '0'} // Mock relation
          change={5.4} 
          trend="up"
          icon={<Eye size={20} />} 
        />
        <MetricCard 
          title="CTR" 
          value={`${stats.ctr}%`} 
          change={0.8} 
          trend="down"
          icon={<PlayCircle size={20} />} 
        />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Growth Trajectory</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}}
                    itemStyle={{color: '#818cf8'}}
                />
                <Area 
                    type="monotone" 
                    dataKey="subs" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSubs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Daily Production</h3>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded">24/7 CYCLE</span>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Long Form</p>
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center gap-3">
                        <Circle size={18} className="text-slate-500" />
                        <span className="text-sm text-slate-300">Veo 3 vs Sora Analysis</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Shorts</p>
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center gap-3">
                        <Circle size={18} className="text-slate-500" />
                        <span className="text-sm text-slate-300">AI News Flash: OpenAI</span>
                    </div>
                    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center gap-3">
                        <Circle size={18} className="text-slate-500" />
                        <span className="text-sm text-slate-300">ChatGPT Prompt Secret</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
