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
    <div className="relative min-h-screen flex flex-col bg-[#0b0c10] text-slate-100 selection:bg-[#ff385c] selection:text-white overflow-x-hidden">
      {/* Ninja Mascot Action Background Image */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center sm:bg-top bg-no-repeat opacity-55 filter brightness-100 contrast-110"
        style={{ backgroundImage: `url('/bg-ninja.jpg')` }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#0b0c10]/40 via-[#0b0c10]/60 to-[#0b0c10]/85" />

      {/* Navigation Header */}
      <Header />





      {/* Main Multi-Page Routed Content */}
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


