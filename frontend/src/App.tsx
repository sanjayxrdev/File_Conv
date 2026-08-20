import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FormatsRegistryResponse } from './types';
import { fetchSupportedFormats } from './services/api';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ConverterPage } from './pages/ConverterPage';
import { MergePage } from './pages/Merge';
import { Formats } from './pages/Formats';

export const AppContent: React.FC = () => {
  const [registry, setRegistry] = useState<FormatsRegistryResponse | null>(null);

  useEffect(() => {
    fetchSupportedFormats()
      .then((data) => setRegistry(data))
      .catch((err) => console.error('Failed fetching conversion matrix:', err));
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FBFBFA] text-[#111111] overflow-x-hidden">
      {/* Ambient background gradient blob */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.03] animate-ambient-drift"
          style={{
            background: 'radial-gradient(ellipse at center, #D4C5B0 0%, transparent 70%)',
          }}
        />
      </div>

      <Header />

      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<Home registry={registry} />} />
          <Route
            path="/video-converter"
            element={<ConverterPage categorySlug="video-converter" registry={registry} />}
          />
          <Route
            path="/image-converter"
            element={<ConverterPage categorySlug="image-converter" registry={registry} />}
          />
          <Route
            path="/audio-converter"
            element={<ConverterPage categorySlug="audio-converter" registry={registry} />}
          />
          <Route
            path="/pdf-converter"
            element={<ConverterPage categorySlug="pdf-converter" registry={registry} />}
          />
          <Route
            path="/document-converter"
            element={<ConverterPage categorySlug="document-converter" registry={registry} />}
          />
          <Route
            path="/code-converter"
            element={<ConverterPage categorySlug="code-converter" registry={registry} />}
          />
          <Route
            path="/spreadsheet-converter"
            element={<ConverterPage categorySlug="spreadsheet-converter" registry={registry} />}
          />
          <Route path="/merge-converter" element={<MergePage />} />
          <Route path="/formats" element={<Formats registry={registry} />} />
          <Route
            path="/:categorySlug"
            element={<ConverterPage registry={registry} />}
          />
        </Routes>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-surface-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted font-sans">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink-primary">FILE CONV</span>
            <span className="text-ink-faint">/</span>
            <span>Local-first file conversion</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px]">0 telemetry</span>
            <span className="text-ink-faint">&middot;</span>
            <span className="font-mono text-[11px]">open source</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
