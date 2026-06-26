'use client';

import { useEffect, useState, useCallback } from 'react';
import { useZenithStore } from '@/hooks/useZenithStore';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    targetId: 'section-map',
    title: '🌍 Interactive Map / 3D Globe',
    description: 'Click anywhere on the map to set your zenith point. Toggle between 2D radar map and a real-time 3D rotating Earth using the buttons on the map.',
    position: 'bottom',
  },
  {
    targetId: 'coord-panel',
    title: '📍 Coordinate Panel',
    description: 'Search any city by name, enter coordinates manually, or tap "Locate Me" to use your GPS. Share your sky with anyone via the share link button.',
    position: 'right',
  },
  {
    targetId: 'iss-tracker-panel',
    title: '🚀 ISS Tracker',
    description: 'Live International Space Station position updating every 5 seconds. The 3D globe plots its true, mathematically accurate 90-minute orbital trajectory using real-time TLE telemetry, and perfectly connects your Zenith to the ISS using Spherical Linear Interpolation.',
    position: 'left',
  },
  {
    targetId: 'section-radar',
    title: '🔭 Celestial Radar + Planets',
    description: 'A real-time radar chart shows every visible planet and constellation by altitude and azimuth. Hover any planet for an educational fact card.',
    position: 'top',
  },
  {
    targetId: 'section-weather',
    title: '☀️ Space Weather + Sky Tour',
    description: 'Live solar wind speed, Kp geomagnetic index, and aurora forecasts from NOAA. The Guided Sky Tour flies the 3D globe through 5 major constellations.',
    position: 'top',
  },
  {
    targetId: 'section-planisphere',
    title: '🌌 Sky View Planisphere',
    description: 'A full all-sky dome chart — zenith at centre, horizon at the rim. Shows every visible planet, constellation, and the ISS plotted by true altitude/azimuth.',
    position: 'top',
  },
  {
    targetId: 'section-ai',
    title: '🤖 AI Celestial Oracle',
    description: 'Ask anything about what\'s in your sky right now. Powered by Groq AI — get instant answers about planets, constellations, or the ISS pass times.',
    position: 'top',
  },
  {
    targetId: 'section-events',
    title: '🌙 Celestial Events',
    description: 'Countdown timers to the next full moon, new moon, and 2026 meteor shower peaks. The current moon phase is always displayed in the header.',
    position: 'top',
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

export default function WebsiteTour() {
  const { websiteTourActive, websiteTourStep, setWebsiteTourActive, setWebsiteTourStep } = useZenithStore();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const PAD = 12;

  const current = STEPS[websiteTourStep];

  const measureTarget = useCallback(() => {
    if (!current) return;
    const el = document.getElementById(current.targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });

      // Tooltip positioning
      const TW = Math.min(360, window.innerWidth - 32);
      const TH = 200;
      let top = 0, left = 0;
      if (current.position === 'bottom') { top = r.bottom + PAD; left = r.left + r.width / 2 - TW / 2; }
      else if (current.position === 'top') { top = r.top - TH - PAD; left = r.left + r.width / 2 - TW / 2; }
      else if (current.position === 'right') { top = r.top + r.height / 2 - TH / 2; left = r.right + PAD; }
      else { top = r.top + r.height / 2 - TH / 2; left = r.left - TW - PAD; }

      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - TW - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - TH - 8));
      setTooltipPos({ top, left });
    }, 500);
  }, [current]);

  useEffect(() => {
    if (websiteTourActive) measureTarget();
  }, [websiteTourActive, websiteTourStep, measureTarget]);

  const next = () => {
    if (websiteTourStep < STEPS.length - 1) setWebsiteTourStep(websiteTourStep + 1);
    else setWebsiteTourActive(false);
  };
  const prev = () => { if (websiteTourStep > 0) setWebsiteTourStep(websiteTourStep - 1); };
  const exit = () => setWebsiteTourActive(false);

  if (!websiteTourActive || !targetRect) return null;

  const { top, left, width, height } = targetRect;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Blackout overlay with cut-out hole via SVG clipPath */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ cursor: 'default' }} onClick={exit}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={left - PAD} y={top - PAD}
              width={width + PAD * 2} height={height + PAD * 2}
              rx="10" fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Highlight border around target */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: top - PAD,
          left: left - PAD,
          width: width + PAD * 2,
          height: height + PAD * 2,
          borderRadius: 10,
          border: '2px solid rgba(79,195,247,0.8)',
          boxShadow: '0 0 0 4px rgba(79,195,247,0.15), 0 0 24px rgba(79,195,247,0.3)',
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute glass-card-bright pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left, width: Math.min(360, window.innerWidth - 32), padding: '16px', zIndex: 201 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display text-xs text-aurora tracking-widest">{current.title}</h3>
          <button onClick={exit} className="font-mono text-[10px] text-starlight/40 hover:text-red-400 transition-colors ml-2 flex-shrink-0">✕ EXIT</button>
        </div>
        <div className="panel-rule mb-2" />
        <p className="font-mono text-[11px] text-starlight/70 leading-relaxed mb-4">{current.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-starlight/30">{websiteTourStep + 1} / {STEPS.length}</span>
          <div className="flex gap-1.5">
            {/* Step dots */}
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setWebsiteTourStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === websiteTourStep ? 'bg-aurora' : 'bg-starlight/20 hover:bg-starlight/40'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {websiteTourStep > 0 && (
              <button onClick={prev} className="font-mono text-[10px] text-starlight/50 hover:text-aurora transition-colors">◀ PREV</button>
            )}
            <button
              onClick={next}
              className="px-3 py-1 font-mono text-[10px] tracking-widest bg-aurora/10 border border-aurora/40 text-aurora hover:bg-aurora/20 rounded transition-all"
            >
              {websiteTourStep < STEPS.length - 1 ? 'NEXT ▶' : 'DONE ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
