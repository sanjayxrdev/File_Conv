import { useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowsLeftRight, GridFour, GitMerge } from '@phosphor-icons/react';
import gsap from 'gsap';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }, headerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!headerRef.current) return;
      const y = window.scrollY;
      const opacity = Math.min(0.98, 0.9 + y / 500);
      const blur = Math.min(16, 4 + y / 100);
      headerRef.current.style.backgroundColor = `rgba(251, 251, 250, ${opacity})`;
      headerRef.current.style.backdropFilter = `blur(${blur}px)`;
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-[#FBFBFA]/90 backdrop-blur-sm border-b border-surface-border transition-[box-shadow] duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-card bg-ink-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <ArrowsLeftRight className="w-4 h-4 text-white" weight="bold" />
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-ink-primary">
            FILE CONV
          </span>
        </Link>

        <nav className="flex items-center gap-1 font-sans">
          <Link
            to="/merge-converter"
            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all flex items-center gap-1.5 ${
              location.pathname === '/merge-converter'
                ? 'bg-ink-primary text-white'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" weight="bold" />
            <span>Merge</span>
          </Link>

          <Link
            to="/formats"
            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-all flex items-center gap-1.5 ${
              location.pathname === '/formats'
                ? 'bg-ink-primary text-white'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-raised'
            }`}
          >
            <GridFour className="w-3.5 h-3.5" weight="bold" />
            <span>Formats</span>
          </Link>
        </nav>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-card bg-ink-primary text-white text-xs font-semibold hover:bg-[#333333] active:scale-[0.98] transition-all duration-150"
        >
          Convert Now
        </button>
      </div>
    </header>
  );
};
