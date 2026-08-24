import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FormatsRegistryResponse } from './types';
import { fetchSupportedFormats } from './services/api';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ConverterPage } from './pages/ConverterPage';
import { OcrStudio } from './pages/OcrStudio';
import { MergePage } from './pages/Merge';
import { Formats } from './pages/Formats';

import { RearrangePdfPage } from './pages/pdf/RearrangePdfPage';
import { ComparePdfPage } from './pages/pdf/ComparePdfPage';
import { SplitPdfPage } from './pages/pdf/SplitPdfPage';
import { AddPageNumbersPage } from './pages/pdf/AddPageNumbersPage';
import { RotatePdfPage } from './pages/pdf/RotatePdfPage';
import { ExtractPdfPage } from './pages/pdf/ExtractPdfPage';
import { ProtectPdfPage } from './pages/pdf/ProtectPdfPage';
import { TransparentSignaturePage } from './pages/pdf/TransparentSignaturePage';
import { RenamePdfPage } from './pages/pdf/RenamePdfPage';
import { AuthProvider } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/AuthModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { QuickCommandPalette } from './components/QuickCommandPalette';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-canvas text-ink-primary font-sans">
          <div className="max-w-md w-full p-8 rounded-card-lg bg-surface-card border border-surface-border text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-accent-red/20 text-accent-red-text flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold font-serif">Something went wrong</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 rounded-card bg-ink-primary text-surface-canvas font-semibold text-sm hover:opacity-90 transition-all"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AppContent: React.FC = () => {
  const [registry, setRegistry] = useState<FormatsRegistryResponse | null>(null);

  useEffect(() => {
    fetchSupportedFormats()
      .then((data) => setRegistry(data))
      .catch((err) => console.error('Failed fetching conversion matrix:', err));
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-surface-canvas text-ink-primary overflow-x-hidden font-sans selection:bg-ink-primary selection:text-surface-canvas">
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
            path="/spreadsheet-converter"
            element={<ConverterPage categorySlug="spreadsheet-converter" registry={registry} />}
          />
          <Route
            path="/presentation-converter"
            element={<ConverterPage categorySlug="presentation-converter" registry={registry} />}
          />
          <Route
            path="/vector-converter"
            element={<ConverterPage categorySlug="vector-converter" registry={registry} />}
          />
          <Route
            path="/ocr-converter"
            element={<OcrStudio />}
          />
          <Route path="/merge-converter" element={<MergePage />} />
          <Route path="/formats" element={<Formats registry={registry} />} />

          {/* Dedicated PDF Manipulation Utility Routes */}
          <Route path="/pdf/rearrange" element={<RearrangePdfPage />} />
          <Route path="/pdf/compare" element={<ComparePdfPage />} />
          <Route path="/pdf/split" element={<SplitPdfPage />} />
          <Route path="/pdf/page-numbers" element={<AddPageNumbersPage />} />
          <Route path="/pdf/rotate" element={<RotatePdfPage />} />
          <Route path="/pdf/extract" element={<ExtractPdfPage />} />
          <Route path="/pdf/protect" element={<ProtectPdfPage />} />
          <Route path="/pdf/transparent-signature" element={<TransparentSignaturePage />} />
          <Route path="/pdf/rename" element={<RenamePdfPage />} />
          <Route
            path="/:categorySlug"
            element={<ConverterPage registry={registry} />}
          />
        </Routes>
      </main>

      {/* History Drawer, Auth Modal & Quick Command Palette */}
      <HistoryDrawer />
      <AuthModal />
      <QuickCommandPalette />

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-surface-border py-8 px-4 bg-surface-canvas">
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
            <span className="text-ink-faint">&middot;</span>
            <span className="font-mono text-[11px] bg-surface-raised px-2 py-0.5 rounded border border-surface-border">
              Ctrl+K
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <HistoryProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </HistoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
