import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  target?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, trend, target }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-5 rounded-2xl hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-700/50 rounded-lg text-slate-300">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
            trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
          }`}>
            {trend === 'up' && <ArrowUpRight size={14} className="mr-1" />}
            {trend === 'down' && <ArrowDownRight size={14} className="mr-1" />}
            {trend === 'neutral' && <Minus size={14} className="mr-1" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        {target && (
          <div className="mt-2 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, (typeof value === 'number' && parseFloat(target) ? (value / parseFloat(target)) * 100 : 0))}%` }}
            ></div>
          </div>
        )}
        {target && <p className="text-xs text-slate-500 mt-1">Target: {target}</p>}
      </div>
    </div>
  );
};

export default MetricCard;