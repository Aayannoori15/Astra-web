import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';

export const revalidate = 0;

const WTIA_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';

const FALLBACK_TLE = {
  line1: '1 25544U 98067A   25174.50000000  .00016717  00000-0  10270-3 0  9003',
  line2: '2 25544  51.6400 200.0000 0001000  80.0000 280.0000 15.50000000400000',
};

function computeFromTLE(line1: string, line2: string) {
  const satrec = satellite.twoline2satrec(line1, line2);
  const now = new Date();
  const posVel = satellite.propagate(satrec, now);

  if (!posVel.position || typeof posVel.position === 'boolean') {
    throw new Error('TLE propagation failed');
  }

  const gmst = satellite.gstime(now);
  const positionGd = satellite.eciToGeodetic(posVel.position, gmst);
  
  const velocityKmS = Math.sqrt(
    Math.pow(posVel.velocity ? (posVel.velocity as satellite.EciVec3<number>).x : 0, 2) +
    Math.pow(posVel.velocity ? (posVel.velocity as satellite.EciVec3<number>).y : 0, 2) +
    Math.pow(posVel.velocity ? (posVel.velocity as satellite.EciVec3<number>).z : 0, 2)
  );

  return {
    iss_position: {
      latitude: satellite.degreesLat(positionGd.latitude).toFixed(4),
      longitude: satellite.degreesLong(positionGd.longitude).toFixed(4),
    },
    altitude: Math.round(positionGd.height),
    velocity: Math.round(velocityKmS * 3600), // km/h
    timestamp: Math.floor(now.getTime() / 1000),
    tle: { line1, line2 } // Return TLE for frontend orbit drawing
  };
}

export async function GET() {
  // Strategy 1: Fast reliable API
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(WTIA_URL, { signal: controller.signal, next: { revalidate: 0 } });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        iss_position: {
          latitude: String(data.latitude),
          longitude: String(data.longitude),
        },
        timestamp: Math.floor(data.timestamp),
        altitude: Math.round(data.altitude),
        velocity: parseFloat((data.velocity / 3600).toFixed(2)),
      });
    }
  } catch (err) {
    console.warn('[/api/iss] WhereTheISS failed, trying CelesTrak');
  }

  // Strategy 2: Live TLE
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(TLE_URL, { signal: controller.signal, next: { revalidate: 0 } });
    clearTimeout(timer);

    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n').map((l: string) => l.trim());
      if (lines.length >= 3) {
        return NextResponse.json(computeFromTLE(lines[1], lines[2]));
      }
    }
  } catch (err) {
    console.warn('[/api/iss] CelesTrak failed, using offline fallback');
  }

  // Strategy 3: Offline Hardcoded TLE
  return NextResponse.json(computeFromTLE(FALLBACK_TLE.line1, FALLBACK_TLE.line2));
}
