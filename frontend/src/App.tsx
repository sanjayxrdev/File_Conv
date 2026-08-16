import React, { useState, useEffect } from 'react';
import { FormatsRegistryResponse } from './types';
import { fetchSupportedFormats } from './services/api';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { MergePage } from './pages/Merge';
import { Formats } from './pages/Formats';
import { About } from './pages/About';
import { BackgroundCanvas } from './components/BackgroundCanvas';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'merge' | 'formats' | 'about'>('home');
  const [registry, setRegistry] = useState<FormatsRegistryResponse | null>(null);

  useEffect(() => {
    fetchSupportedFormats()
      .then((data) => setRegistry(data))
      .catch((err) => console.error('Failed fetching conversion matrix:', err));
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-dark-bg text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Three.js Subtle Ambient Background */}
      <BackgroundCanvas />

      {/* Navigation Header */}
      <Header currentTab={currentTab} onNavigate={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 py-6">
        {currentTab === 'home' && <Home registry={registry} />}
        {currentTab === 'merge' && <MergePage />}
        {currentTab === 'formats' && <Formats registry={registry} />}
        {currentTab === 'about' && <About />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            FILE CONV — Local-First File Conversion & Merging Platform. Open-source MIT License.
          </div>
          <div className="font-mono text-slate-600">
            FastAPI • React • Vite • Tailwind • GSAP • Three.js
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
