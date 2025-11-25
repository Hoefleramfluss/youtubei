
import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, Search, Wifi, WifiOff, Clock } from 'lucide-react';
import { LogEntry } from '../types';

const MonitorPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (!isLive) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/api/logs?userId=demo', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        setIsConnected(true);
        setLastUpdated(new Date());
      } else {
        throw new Error('API Error');
      }
    } catch (error) {
      setIsConnected(false);
      // Keep existing logs if connection drops temporarily
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Faster polling for "Live" feel
    return () => clearInterval(interval);
  }, [isLive]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'UPLOAD': return 'text-emerald-400';
      case 'VEO': return 'text-purple-400';
      case 'TREND': return 'text-blue-400';
      case 'SCRIPT': return 'text-amber-400';
      case 'NATIVE_AUDIO': return 'text-pink-400';
      case 'SYSTEM': return 'text-slate-500';
      case 'STRATEGY': return 'text-indigo-400';
      case 'ANALYTICS': return 'text-cyan-400';
      default: return 'text-slate-300';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.category === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <Terminal className="text-indigo-500" />
            Live System Monitor
          </h1>
          <div className="flex items-center gap-3 text-sm">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs font-medium border border-emerald-400/20">
                <Wifi size={12} /> Connected to Agent Core
              </span>
            ) : (
               <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs font-medium border border-amber-400/20">
                <WifiOff size={12} /> Reconnecting...
              </span>
            )}
            {lastUpdated && (
              <span className="flex items-center gap-1 text-slate-600 text-xs">
                <Clock size={12}/> Last sync: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    isLive 
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
            >
                <Activity size={14} />
                {isLive ? 'Polling Active' : 'Paused'}
            </button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full max-w-md focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <Search size={18} className="text-slate-500" />
            <input 
                type="text" 
                placeholder="Grep logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-200 text-sm w-full placeholder:text-slate-600 font-mono"
            />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
            {['ALL', 'SYSTEM', 'TREND', 'SCRIPT', 'VEO', 'NATIVE_AUDIO', 'UPLOAD'].map((cat) => (
                <button
                    key={cat}
                    onClick={() => setFilter(cat === 'ALL' ? 'ALL' : cat)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap border ${
                        filter === cat 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                >
                    {cat.replace('_', ' ')}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col font-mono text-sm relative shadow-2xl">
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
              root@growth-os:~# tail -f /var/log/agent.log
            </span>
            <span>{filteredLogs.length} events</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {filteredLogs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-2">
                    <Terminal size={48} strokeWidth={1} />
                    <p className="font-sans text-sm">Waiting for system events...</p>
                </div>
            )}
            
            {filteredLogs.map((log) => (
                <div key={log.id} className="group hover:bg-slate-900/60 -mx-2 px-2 py-1.5 rounded transition-colors flex gap-3 items-start border-l-2 border-transparent hover:border-slate-700">
                    <span className="text-slate-600 shrink-0 select-none w-24 text-xs pt-0.5 opacity-70">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    <span className={`font-bold shrink-0 w-28 text-xs pt-0.5 uppercase tracking-wide ${getCategoryColor(log.category)}`}>
                        {log.category.replace('_', ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                        <span className="text-slate-300 break-words leading-relaxed">{log.message}</span>
                        {log.details && (
                            <div className="text-xs text-slate-500 mt-1 font-sans bg-slate-900/50 p-2 rounded border border-slate-800/50 hidden group-hover:block animate-in fade-in duration-200">
                                {log.details}
                            </div>
                        )}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${
                        log.status === 'SUCCESS' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                        log.status === 'ERROR' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                        'text-slate-700 border-slate-800 bg-slate-800/50'
                    }`}>
                        {log.status}
                    </span>
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MonitorPage;
