
import React, { useState } from 'react';
import { Copy, Sparkles, RefreshCw } from 'lucide-react';
import { VEO_PROMPT_TEMPLATES } from '../constants';
import { ContentItemType } from '../types';

const VeoPromptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ContentItemType>('SHORT');
  const [hook, setHook] = useState('');
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('General Tech Enthusiasts');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const generate = () => {
    if (mode === 'LONGFORM') {
      setGeneratedPrompt(VEO_PROMPT_TEMPLATES.LONGFORM(topic || '[TOPIC]', goal || 'Educate', audience));
    } else {
      setGeneratedPrompt(VEO_PROMPT_TEMPLATES.SHORT(topic || '[TOPIC]', hook || '[VISUAL HOOK]'));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    // In a real app, add toast notification here
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6 text-indigo-400">
          <Sparkles size={20} />
          <h2 className="text-lg font-semibold text-white">Veo 3 Prompt Engineer</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Content Format</label>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setMode('LONGFORM')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'LONGFORM' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Long Form (16:9)
              </button>
              <button
                onClick={() => setMode('SHORT')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'SHORT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                YouTube Short (9:16)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Video Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Sora vs Google Veo 3 Comparison"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {mode === 'LONGFORM' ? (
            <>
               <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Primary Goal</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Convert viewers to subscribers"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Visual Hook (0-3s)</label>
              <textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Describe the first 3 seconds visually..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          <button
            onClick={generate}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 transition-colors shadow-lg shadow-indigo-900/20"
          >
            <RefreshCw size={18} />
            Generate Prompt
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <button 
            onClick={copyToClipboard}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={18} />
          </button>
        </div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Prompt Output</h3>
        
        <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {generatedPrompt ? generatedPrompt : (
            <span className="text-slate-600 italic">
              Configure the parameters on the left and click "Generate" to create a production-ready Google Veo 3 prompt...
            </span>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
          <span>Target Model: Google Veo 3</span>
          <span>Optimized for: {mode === 'LONGFORM' ? 'Retention (VTR)' : 'Viral Reach (CTR)'}</span>
        </div>
      </div>
    </div>
  );
};

export default VeoPromptGenerator;
