import React from 'react';
import { ShieldCheck, Server, Terminal, Lock, Code2, Cpu } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">About FILE CONV</h2>
        <p className="text-slate-400 text-sm">
          An open-source, local-first universal file conversion toolkit built for developers and students.
        </p>
      </div>

      <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
        
        {/* Core Architecture */}
        <div className="p-6 rounded-2xl bg-dark-card border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span>Architecture & Design Principles</span>
          </h3>
          <p>
            Unlike generic web converters that send files to untrusted cloud servers or attempt impossible conversions like <code className="text-blue-400">.mp3 → .docx</code>, FILE CONV operates on a <strong>backend-first local conversion matrix</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Local Engine Execution:</strong> Real transcode pipelines (FFmpeg, PyMuPDF, Pillow, python-docx, openpyxl).</li>
            <li><strong>Central Conversion Matrix:</strong> Validates target compatibility before showing options.</li>
            <li><strong>Subprocess Security:</strong> Executes external binaries using strict argument arrays with zero shell string interpolation.</li>
            <li><strong>UUID Isolation:</strong> All uploaded and generated files are isolated under UUID paths and automatically purged after conversion.</li>
          </ul>
        </div>

        {/* Security */}
        <div className="p-6 rounded-2xl bg-dark-card border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>Security Architecture</span>
          </h3>
          <p>
            FILE CONV is designed to run securely on localhost or inside Docker containers. Key security guarantees include:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-white block mb-1">Argument Array Execution</span>
              <span className="text-slate-400">No shell injection vulnerabilities (uses subprocess.run arrays).</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-white block mb-1">MIME & Magic-Byte Validation</span>
              <span className="text-slate-400">File extensions and contents are verified before engine routing.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-white block mb-1">Timeout Limits</span>
              <span className="text-slate-400">Executions are bounded by timeout enforcement to prevent resource locks.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-semibold text-white block mb-1">Auto Storage Purge</span>
              <span className="text-slate-400">Background tasks automatically clean temporary conversion files.</span>
            </div>
          </div>
        </div>

        {/* Engine Tech Stack */}
        <div className="p-6 rounded-2xl bg-dark-card border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span>Engine Technologies</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white">FFmpeg</div>
              <div className="text-[11px] text-slate-400">Video & Audio</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white">PyMuPDF</div>
              <div className="text-[11px] text-slate-400">PDF & Rendering</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white">Pillow</div>
              <div className="text-[11px] text-slate-400">Image Processing</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white">python-docx</div>
              <div className="text-[11px] text-slate-400">Documents</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
