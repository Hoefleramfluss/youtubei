
import React from 'react';
import { LayoutDashboard, TrendingUp, Video, BarChart2, Zap, Settings, Activity, Terminal } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'monitor', label: 'Live Monitor', icon: <Activity size={20} /> },
    { id: 'trends', label: 'Trends & Strategy', icon: <TrendingUp size={20} /> },
    { id: 'production', label: 'Veo Studio', icon: <Video size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-white">AI</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-100 tracking-tight leading-none">GrowthOS</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider">ENTERPRISE</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <div 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
            activeTab === 'settings' 
              ? 'bg-indigo-900/50 text-indigo-200' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </div>
        <div className="mt-4 flex items-center gap-2 px-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-500">System Operational</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
