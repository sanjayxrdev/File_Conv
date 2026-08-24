import React, { useState } from 'react';
import {
  FileText,
  Scan,
  Video,
  MusicNotes,
  Table,
  ArrowRight,
  Lightning,
  Sparkle,
  CheckCircle,
  Cpu,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { Card3DTilt } from './Card3DTilt';

interface SandboxRoute {
  id: string;
  source: string;
  target: string;
  title: string;
  icon: React.ReactNode;
  latency: string;
  engine: string;
  benefit: string;
  outputPreview: string;
}

export const Interactive3DConverterSandbox: React.FC = () => {
  const routes: SandboxRoute[] = [
    {
      id: 'pdf-docx',
      source: 'PDF',
      target: 'DOCX',
      title: 'PDF to Word Vector Rebuild',
      icon: <FileText className="w-5 h-5 text-blue-500" weight="bold" />,
      latency: '0.22s',
      engine: 'PyMuPDF Native',
      benefit: 'Extracts editable typography & headers',
      outputPreview: 'Financial_Report_2026.docx',
    },
    {
      id: 'scan-ocr',
      source: 'PNG / SCAN',
      target: 'MD (OCR)',
      title: 'Docling Deep Layout OCR',
      icon: <Scan className="w-5 h-5 text-purple-500" weight="bold" />,
      latency: '0.48s',
      engine: 'Docling Neural AI',
      benefit: 'Parses tables & reading hierarchy',
      outputPreview: 'Research_Paper.md + AST.json',
    },
    {
      id: 'video-audio',
      source: 'MP4 / MKV',
      target: 'MP3',
      title: 'Lossless Audio Demuxer',
      icon: <MusicNotes className="w-5 h-5 text-emerald-500" weight="bold" />,
      latency: '0.14s',
      engine: 'FFmpeg Vector Pipeline',
      benefit: '320kbps high-fidelity audio stream',
      outputPreview: 'Keynote_Presentation.mp3',
    },
    {
      id: 'json-excel',
      source: 'JSON / CSV',
      target: 'XLSX',
      title: 'Tabular Sheet Generator',
      icon: <Table className="w-5 h-5 text-amber-500" weight="bold" />,
      latency: '0.08s',
      engine: 'OpenPyXL Core',
      benefit: 'Auto-formats cells & calculation grids',
      outputPreview: 'Analytics_Database.xlsx',
    },
  ];

  const [selectedRoute, setSelectedRoute] = useState<SandboxRoute>(routes[0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTriggerSim = (route: SandboxRoute) => {
    setSelectedRoute(route);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsFlipped(true);
    }, 450);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-6 sm:p-10 space-y-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-accent-purple border border-accent-purple-text/20 text-accent-purple-text text-[11px] font-semibold">
            <Lightning className="w-3.5 h-3.5" weight="fill" />
            <span>Interactive Conversion Sandbox</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-ink-primary">
            Live 3D Transformation Simulator
          </h3>
          <p className="text-xs text-ink-muted">
            Click any format route below to preview real-time local engine throughput and output benchmarks.
          </p>
        </div>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface-raised border border-surface-border text-xs font-semibold text-ink-primary hover:bg-surface-card transition-all"
        >
          <ArrowsClockwise className="w-3.5 h-3.5 text-accent-purple-text" weight="bold" />
          <span>Flip 3D Preview Card</span>
        </button>
      </div>

      {/* Grid: 4 Interactive Routes + 3D Flip Display Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: 4 Interactive Route Cards with 3D Tilt */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {routes.map((r) => {
            const isSelected = selectedRoute.id === r.id;
            return (
              <Card3DTilt key={r.id} maxRotation={8} scale={1.03}>
                <button
                  onClick={() => handleTriggerSim(r)}
                  className={`w-full p-4 rounded-card-lg text-left border transition-all h-full flex flex-col justify-between ${
                    isSelected
                      ? 'border-ink-primary bg-surface-raised ring-2 ring-ink-primary/20 shadow-sm'
                      : 'border-surface-border bg-surface-card hover:border-ink-muted'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-card bg-surface-card border border-surface-border">
                        {r.icon}
                      </div>
                      <span className="font-mono text-[10px] font-bold text-accent-purple-text bg-accent-purple px-1.5 py-0.5 rounded border border-accent-purple-text/20">
                        {r.latency}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs text-ink-primary">{r.title}</h4>
                      <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">{r.benefit}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-3 mt-2 border-t border-surface-border text-ink-muted">
                    <span className="font-bold uppercase text-ink-primary">.{r.source}</span>
                    <ArrowRight className="w-3 h-3 text-accent-purple-text" weight="bold" />
                    <span className="font-bold uppercase text-ink-primary">.{r.target}</span>
                  </div>
                </button>
              </Card3DTilt>
            );
          })}
        </div>

        {/* Right: 3D Flip Preview Stage */}
        <div className="lg:col-span-6 flex items-center justify-center p-4 min-h-[320px] select-none">
          <div
            style={{ perspective: '1000px' }}
            className="w-full max-w-sm h-72 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              style={{
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="relative w-full h-full"
            >
              {/* Front Face: Input Benchmark */}
              <div
                style={{ backfaceVisibility: 'hidden' }}
                className="absolute inset-0 rounded-card-lg bg-surface-raised border border-surface-border p-6 flex flex-col justify-between shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    Source Route Input
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-mono">
                    <CheckCircle className="w-4 h-4" weight="fill" />
                    <span>Validated</span>
                  </div>
                </div>

                <div className="space-y-2 text-center py-4">
                  <div className="w-12 h-12 mx-auto rounded-card bg-surface-card border border-surface-border flex items-center justify-center text-ink-primary shadow-xs">
                    {selectedRoute.icon}
                  </div>
                  <h4 className="font-sans font-bold text-base text-ink-primary">
                    {selectedRoute.source} &rarr; {selectedRoute.target}
                  </h4>
                  <p className="text-xs text-ink-muted">{selectedRoute.engine}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted border-t border-surface-border pt-2">
                  <span>Latency: {selectedRoute.latency}</span>
                  <span className="text-accent-purple-text font-bold">Click to Flip 3D</span>
                </div>
              </div>

              {/* Back Face: Transformed Target Output */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 rounded-card-lg bg-surface-card border-2 border-accent-purple-text/40 p-6 flex flex-col justify-between shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-accent-purple-text font-bold">
                    Synthesized Output
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">100% Local</span>
                </div>

                <div className="space-y-2 py-4">
                  <div className="p-3 rounded-card bg-surface-raised border border-surface-border font-mono text-xs text-ink-primary truncate">
                    &ldquo;{selectedRoute.outputPreview}&rdquo;
                  </div>
                  <div className="space-y-1 text-xs text-ink-secondary">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Throughput</span>
                      <span className="font-mono font-semibold text-emerald-600">
                        {selectedRoute.latency} &bull; Instant
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Privacy Leakage</span>
                      <span className="font-mono font-semibold text-ink-primary">0% (Local)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted border-t border-surface-border pt-2">
                  <span className="text-emerald-600 font-bold">Ready for export</span>
                  <span>Click to Flip</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
