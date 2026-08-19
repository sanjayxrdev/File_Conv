import React, { useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Combine, Grid } from 'lucide-react';
import gsap from 'gsap';

export const Header: React.FC = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0b0c10]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl w-full">
      <div
        ref={navRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
      >
        {/* Editorial Brand Logo with Ninja Mascot Icon */}
        <Link
          to="/"
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/logo.png"
            alt="Ninja File Converter Icon"
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform filter drop-shadow-[0_4px_12px_rgba(0,242,254,0.4)]"
          />
          <div className="flex items-center gap-2">
            <h1 className="font-syne font-extrabold text-xl tracking-tight text-white group-hover:text-[#00f2fe] transition-colors">
              FILE CONV
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
              NINJA
            </span>
          </div>
        </Link>

        {/* Navigation Bar Links */}
        <nav className="flex items-center gap-1 sm:gap-2 font-heading">
          <Link
            to="/merge-converter"
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === '/merge-converter'
                ? 'bg-[#ff385c]/20 text-[#ff385c] border border-[#ff385c]/40 shadow-lg shadow-[#ff385c]/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Combine className="w-4 h-4 text-[#ff385c]" />
            <span>Merge Files</span>
          </Link>

          <Link
            to="/"
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              location.pathname === '/'
                ? 'bg-[#ff385c]/20 text-[#ff385c] border border-[#ff385c]/40 shadow-lg shadow-[#ff385c]/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid className="w-4 h-4 text-[#00f2fe]" />
            <span>All Converters</span>
          </Link>
        </nav>

        {/* Right Action CTA */}
        <div className="flex items-center gap-2 font-heading">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff385c] to-[#e02847] hover:from-[#ff4d6d] hover:to-[#ff385c] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#ff385c]/25 active:scale-95 transition-all"
          >
            Convert Now
          </button>
        </div>
      </div>
    </header>
  );
};






