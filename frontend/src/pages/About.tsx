import React, { useRef, useEffect } from 'react';
import { ShieldCheck, DesktopTower, Terminal, Lock, Code, Cpu } from '@phosphor-icons/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const About: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(pageRef.current!.querySelector('h1'), {
        y: 20,
        opacity: 0,
        duration: 0.5,
      })
      .from(pageRef.current!.querySelector('.subtitle'), {
        y: 15,
        opacity: 0,
        duration: 0.4,
      }, "-=0.3");
    }, pageRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!sectionsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(sectionsRef.current!.children, {
        scrollTrigger: {
          trigger: sectionsRef.current!,
          start: "top 80%",
          once: true,
        },
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, sectionsRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="max-w-3xl mx-auto px-4 py-12 space-y-10">

      <div className="text-center space-y-3">
        <h1 className="font-serif text-4xl text-ink-primary">About FILE CONV</h1>
        <p className="subtitle text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
          An open-source, local-first universal file conversion toolkit built for developers and students.
        </p>
      </div>

      <div ref={sectionsRef} className="space-y-8 text-ink-secondary text-sm leading-relaxed">

        {/* Architecture */}
        <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
          <h3 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <DesktopTower className="w-4 h-4 text-ink-muted" weight="bold" />
            <span>Architecture & Design Principles</span>
          </h3>
          <p className="text-ink-muted">
            Unlike generic web converters that send files to untrusted cloud servers, FILE CONV operates on a backend-first local conversion matrix.
          </p>
          <ul className="space-y-2 text-ink-muted">
            <li className="flex items-start gap-2">
              <span className="text-ink-faint mt-1">/</span>
              <span><strong className="text-ink-secondary">Local Engine Execution:</strong> Real transcode pipelines (FFmpeg, PyMuPDF, Pillow, python-docx, openpyxl).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ink-faint mt-1">/</span>
              <span><strong className="text-ink-secondary">Central Conversion Matrix:</strong> Validates target compatibility before showing options.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ink-faint mt-1">/</span>
              <span><strong className="text-ink-secondary">Subprocess Security:</strong> Executes external binaries using strict argument arrays with zero shell string interpolation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ink-faint mt-1">/</span>
              <span><strong className="text-ink-secondary">UUID Isolation:</strong> All uploaded and generated files are isolated under UUID paths and automatically purged.</span>
            </li>
          </ul>
        </div>

        {/* Security */}
        <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
          <h3 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <Lock className="w-4 h-4 text-ink-muted" weight="bold" />
            <span>Security Architecture</span>
          </h3>
          <p className="text-ink-muted">
            Designed to run securely on localhost or inside Docker containers with the following guarantees:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
              <span className="font-semibold text-ink-primary block mb-1">Argument Array Execution</span>
              <span className="text-ink-muted">No shell injection vulnerabilities via subprocess.run arrays.</span>
            </div>
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
              <span className="font-semibold text-ink-primary block mb-1">MIME Validation</span>
              <span className="text-ink-muted">File extensions and contents verified before engine routing.</span>
            </div>
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
              <span className="font-semibold text-ink-primary block mb-1">Timeout Limits</span>
              <span className="text-ink-muted">Executions bounded by timeout enforcement to prevent resource locks.</span>
            </div>
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border">
              <span className="font-semibold text-ink-primary block mb-1">Auto Storage Purge</span>
              <span className="text-ink-muted">Background tasks automatically clean temporary conversion files.</span>
            </div>
          </div>
        </div>

        {/* Engine Tech Stack */}
        <div className="p-6 rounded-card-lg bg-surface-card border border-surface-border space-y-4">
          <h3 className="text-base font-semibold text-ink-primary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-ink-muted" weight="bold" />
            <span>Engine Technologies</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border text-center">
              <div className="font-semibold text-ink-primary text-sm">FFmpeg</div>
              <div className="text-[11px] text-ink-muted">Video & Audio</div>
            </div>
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border text-center">
              <div className="font-semibold text-ink-primary text-sm">PyMuPDF</div>
              <div className="text-[11px] text-ink-muted">PDF & Rendering</div>
            </div>
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border text-center">
              <div className="font-semibold text-ink-primary text-sm">Pillow</div>
              <div className="text-[11px] text-ink-muted">Image Processing</div>
            </div>
            <div className="p-3 rounded-card bg-surface-raised border border-surface-border text-center">
              <div className="font-semibold text-ink-primary text-sm">python-docx</div>
              <div className="text-[11px] text-ink-muted">Documents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
