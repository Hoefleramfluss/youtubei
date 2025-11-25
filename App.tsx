
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import VeoPromptGenerator from './components/VeoPromptGenerator';
import ContentStrategy from './pages/ContentStrategy';
import MonitorPage from './pages/MonitorPage';
import SettingsPage from './pages/Settings';
import { Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitor':
        return <MonitorPage />;
      case 'trends':
        return <ContentStrategy />;
      case 'production':
      case 'automation':
        return <VeoPromptGenerator />; // Reusing generator for production tab for MVP
      case 'settings':
        return <SettingsPage />;
      case 'analytics':
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                    <Settings size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Deep Analytics Module initializing...</p>
                </div>
            </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
