import { create } from 'zustand';

export interface Coordinates {
  lat: number;
  lng: number;
  label?: string;
}

export interface ISSPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

export interface CelestialBody {
  name: string;
  type: 'planet' | 'satellite' | 'iss' | 'constellation' | 'star';
  altitude: number;   // degrees above horizon
  azimuth: number;    // degrees from North
  distance?: number;  // km
  velocity?: number;  // km/s
  magnitude?: number; // visual magnitude
  visible: boolean;
  extra?: Record<string, unknown>;
}

export interface SatelliteData {
  name: string;
  catalogNumber: string;
  lat: number;
  lng: number;
  altitude: number;
  velocity: number;
  elevation?: number;
  azimuth?: number;
}

interface ZenithStore {
  coordinates: Coordinates | null;
  issPosition: ISSPosition | null;
  issTLE: { line1: string, line2: string } | null;
  celestialBodies: CelestialBody[];
  satellites: SatelliteData[];
  loading: boolean;
  lastUpdated: Date | null;
  bootComplete: boolean;
  viewMode: '2d' | '3d';

  setCoordinates: (coords: Coordinates) => void;
  setISSPosition: (pos: ISSPosition) => void;
  setISSTLE: (tle: { line1: string, line2: string }) => void;
  setCelestialBodies: (bodies: CelestialBody[]) => void;
  setSatellites: (sats: SatelliteData[]) => void;
  setLoading: (loading: boolean) => void;
  setLastUpdated: (date: Date) => void;
  setBootComplete: (done: boolean) => void;
  setViewMode: (mode: '2d' | '3d') => void;
}

export const useZenithStore = create<ZenithStore>((set) => ({
  coordinates: null,
  issPosition: null,
  issTLE: null,
  celestialBodies: [],
  satellites: [],
  loading: false,
  lastUpdated: null,
  bootComplete: false,
  viewMode: '3d',

  setCoordinates: (coords) => set({ coordinates: coords }),
  setISSPosition: (pos) => set({ issPosition: pos }),
  setISSTLE: (tle) => set({ issTLE: tle }),
  setCelestialBodies: (bodies) => set({ celestialBodies: bodies }),
  setSatellites: (sats) => set({ satellites: sats }),
  setLoading: (loading) => set({ loading }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  setBootComplete: (done) => set({ bootComplete: done }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
