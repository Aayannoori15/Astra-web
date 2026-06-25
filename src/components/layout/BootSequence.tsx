'use client';

import { useEffect, useState } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

const BOOT_LINES = [
  'INITIALIZING CELESTIAL EYE...',
  'CONNECTING TO OPENNOTIFY [ISS TELEMETRY]...',
  'CONNECTING TO CELESTRAK [TLE CATALOG]...',
  'CALIBRATING ASTRONOMICAL ENGINE...',
  'SYNCING ORBITAL MECHANICS...',
  'RADAR ONLINE.',
];

export default function BootSequence() {
  const { bootComplete, setBootComplete } = useZenithStore();
  const [lineIndex, setLineIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    // Skip boot sequence on revisit within same session
    if (sessionStorage.getItem('zenith-booted') === '1') {
      setSkip(true);
      setBootComplete(true);
      return;
    }

    if (lineIndex < BOOT_LINES.length) {
      const t = setTimeout(() => setLineIndex((i) => i + 1), 380);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setFadeOut(true);
        sessionStorage.setItem('zenith-booted', '1');
        setTimeout(() => setBootComplete(true), 500);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [lineIndex, setBootComplete]);

  if (bootComplete || skip) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-void flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center px-6 max-w-md w-full">
        {/* Radar rings animation */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-aurora/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-3 rounded-full border border-aurora/30" />
          <div className="absolute inset-6 rounded-full border border-aurora/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-aurora animate-pulse shadow-[0_0_12px_#FFFFFF]" />
          </div>
          <div
            className="absolute inset-0 origin-center rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.3) 40deg, transparent 80deg)',
              animationDuration: '1.5s',
              animationTimingFunction: 'linear',
            }}
          />
        </div>

        <h1 className="font-display text-2xl font-bold text-aurora tracking-widest glow-text mb-1">
          PROJECT ZENITH
        </h1>
        <p className="font-mono text-[10px] text-starlight/40 tracking-widest mb-8">
          THE CELESTIAL EYE
        </p>

        <div className="text-left font-mono text-xs space-y-1.5 min-h-[140px]">
          {BOOT_LINES.slice(0, lineIndex).map((line, i) => (
            <p key={i} className="text-aurora/70 flex items-center gap-2">
              <span className="text-neutral-400">✓</span>
              {line}
            </p>
          ))}
          {lineIndex < BOOT_LINES.length && (
            <p className="text-starlight/40 flex items-center gap-2">
              <span className="animate-pulse">▸</span>
              <span className="animate-pulse">Loading...</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
