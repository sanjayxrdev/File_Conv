import React, { useState } from 'react';
import {
  FileText,
  Scan,
  Table as TableIcon,
  DownloadSimple,
  ArrowsOut,
  ArrowsIn,
  Eye,
  CheckCircle,
  Lightning,
  Sparkle,
  Code
} from '@phosphor-icons/react';

export const IsometricPipeline3D: React.FC = () => {
  const [isExploded, setIsExploded] = useState(true);
  const [activeLayer, setActiveLayer] = useState<number>(2); // default to Docling AST
  const [tiltAngle, setTiltAngle] = useState({ x: 50, z: -35 });

  const layers = [
    {
      id: 1,
      name: 'Layer 1: Raw Ingestion Vector',
      badge: 'Input Binary',
      icon: <FileText className="w-4 h-4 text-blue-500" weight="bold" />,
      desc: 'Native PyMuPDF / FFmpeg streaming parser handles PDFs, raster scans, and multimedia streams.',
      metrics: ['Bit-exact parsing', 'Zero memory leaks', 'Local buffer stream'],
      zOffsetExploded: 0,
      zOffsetStacked: 0,
      accentBorder: 'border-blue-500/40',
      activeBg: 'bg-blue-500/10',
    },
    {
      id: 2,
      name: 'Layer 2: Docling Layout & Reading Order AST',
      badge: 'AI Neural Core',
      icon: <Scan className="w-4 h-4 text-purple-500" weight="bold" />,
      desc: 'IBM Docling layout recognition model reconstructs paragraph hierarchy, visual reading order, and bounding boxes.',
      metrics: ['99.4% layout confidence', 'Reading flow graph', 'Semantic chunking'],
      zOffsetExploded: 60,
      zOffsetStacked: 15,
      accentBorder: 'border-purple-500/50',
      activeBg: 'bg-purple-500/10',
    },
    {
      id: 3,
      name: 'Layer 3: Tabular Grid Matrix Extraction',
      badge: 'Structure Engine',
      icon: <TableIcon className="w-4 h-4 text-emerald-500" weight="bold" />,
      desc: 'Detects multi-column tabular data, header rows, merged cells, and numerical spreadsheets.',
      metrics: ['2 tables parsed', 'CSV grid generation', 'Column alignment'],
      zOffsetExploded: 120,
      zOffsetStacked: 30,
      accentBorder: 'border-emerald-500/40',
      activeBg: 'bg-emerald-500/10',
    },
    {
      id: 4,
      name: 'Layer 4: Target Artifact Synthesis',
      badge: 'Clean Output',
      icon: <DownloadSimple className="w-4 h-4 text-amber-500" weight="bold" />,
      desc: 'Transcodes directly into editable DOCX, GitHub-Flavored Markdown, clean CSV, and lossless audio/video.',
      metrics: ['Zero cloud telemetry', 'Instant download', '100% loss-free'],
      zOffsetExploded: 180,
      zOffsetStacked: 45,
      accentBorder: 'border-amber-500/40',
      activeBg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-card-lg bg-surface-card border border-surface-border p-6 sm:p-10 space-y-8 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-accent-purple border border-accent-purple-text/20 text-accent-purple-text text-[11px] font-semibold">
            <Sparkle className="w-3.5 h-3.5" weight="fill" />
            <span>Interactive 3D Engine Inspector</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-ink-primary">
            3D Isometric Document Pipeline
          </h3>
          <p className="text-xs text-ink-muted">
            Inspect how files decompose into neural bounding boxes, table grids, and target exports in 3D space.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExploded(!isExploded)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-card bg-surface-raised border border-surface-border text-xs font-semibold text-ink-primary hover:bg-surface-card transition-all"
          >
            {isExploded ? (
              <>
                <ArrowsIn className="w-3.5 h-3.5 text-accent-purple-text" weight="bold" />
                <span>Collapse 3D Stack</span>
              </>
            ) : (
              <>
                <ArrowsOut className="w-3.5 h-3.5 text-accent-purple-text" weight="bold" />
                <span>Explode 3D Layers</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D Stage & Layer Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* 3D Isometric Viewport */}
        <div className="lg:col-span-7 flex items-center justify-center p-4 sm:p-8 min-h-[360px] sm:min-h-[440px] relative overflow-hidden select-none">
          <div
            style={{
              perspective: '1200px',
              perspectiveOrigin: '50% 50%',
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <div
              style={{
                transform: `rotateX(${tiltAngle.x}deg) rotateZ(${tiltAngle.z}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 300ms ease-out',
              }}
              className="relative w-64 h-72 cursor-grab active:cursor-grabbing"
            >
              {layers.map((layer, idx) => {
                const zPos = isExploded ? layer.zOffsetExploded : layer.zOffsetStacked;
                const isSelected = activeLayer === layer.id;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    style={{
                      transform: `translateZ(${zPos}px)`,
                      transformStyle: 'preserve-3d',
                      transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms',
                    }}
                    className={`absolute inset-0 rounded-card p-4 flex flex-col justify-between border-2 bg-surface-card shadow-md cursor-pointer ${
                      isSelected
                        ? `${layer.accentBorder} ring-2 ring-ink-primary/20 ${layer.activeBg}`
                        : 'border-surface-border hover:border-ink-muted opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Layer Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-surface-raised border border-surface-border">
                          {layer.icon}
                        </div>
                        <span className="font-semibold text-xs text-ink-primary font-mono">
                          {layer.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-muted">L{idx + 1}</span>
                    </div>

                    {/* Layer Content Wireframe Mock */}
                    <div className="space-y-1.5 my-2">
                      <div className="w-full h-2 rounded bg-surface-raised border border-surface-border" />
                      <div className="w-4/5 h-2 rounded bg-surface-raised border border-surface-border" />
                      <div className="w-3/5 h-2 rounded bg-surface-raised border border-surface-border" />
                      {layer.id === 3 && (
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <div className="h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
                          <div className="h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
                          <div className="h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
                        </div>
                      )}
                    </div>

                    {/* Layer Bottom Tag */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-ink-muted border-t border-surface-border pt-1">
                      <span>Z: +{zPos}px</span>
                      <span className="font-bold text-ink-primary">
                        {isSelected ? 'ACTIVE' : 'SELECT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Layer Details & Inspection Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center justify-between">
            <span>Layer Inspector</span>
            <span className="text-accent-purple-text font-mono">Layer {activeLayer} of 4</span>
          </div>

          {layers.map((layer) => {
            if (layer.id !== activeLayer) return null;
            return (
              <div
                key={layer.id}
                className="p-5 rounded-card-lg bg-surface-raised border border-surface-border space-y-4 animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-card bg-surface-card border border-surface-border flex items-center justify-center shrink-0">
                    {layer.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-ink-primary">{layer.name}</h4>
                    <span className="text-[11px] font-mono text-accent-purple-text font-semibold">
                      {layer.badge}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">{layer.desc}</p>

                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <span className="text-[11px] font-semibold text-ink-primary block">
                    Telemetry & Accuracy Signals:
                  </span>
                  <div className="space-y-1.5">
                    {layer.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-ink-secondary">
                        <CheckCircle className="w-3.5 h-3.5 text-accent-green-text shrink-0" weight="fill" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {layers.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`py-2 px-1 text-center rounded-card text-[11px] font-mono font-semibold transition-all border ${
                  activeLayer === l.id
                    ? 'bg-ink-primary text-surface-canvas border-ink-primary shadow-xs'
                    : 'bg-surface-card border-surface-border text-ink-muted hover:text-ink-primary'
                }`}
              >
                Layer {l.id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
