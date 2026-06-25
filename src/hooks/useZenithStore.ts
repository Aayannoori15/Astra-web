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
  type: 'planet' | 'satellite' | 'iss' | 'constellation' | 'star' | 'dso';
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
  audioEnabled: boolean;
  tourActive: boolean;
  tourIndex: number;
  alerts: string[]; // List of rise times or IDs for scheduled push alerts

  setCoordinates: (coords: Coordinates) => void;
  setISSPosition: (pos: ISSPosition) => void;
  setISSTLE: (tle: { line1: string, line2: string }) => void;
  setCelestialBodies: (bodies: CelestialBody[]) => void;
  setSatellites: (sats: SatelliteData[]) => void;
  setLoading: (loading: boolean) => void;
  setLastUpdated: (date: Date) => void;
  setBootComplete: (done: boolean) => void;
  setViewMode: (mode: '2d' | '3d') => void;
  setAudioEnabled: (enabled: boolean) => void;
  setTourActive: (active: boolean) => void;
  setTourIndex: (idx: number) => void;
  toggleAlert: (passId: string) => void;
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
  audioEnabled: false,
  tourActive: false,
  tourIndex: 0,
  alerts: [],

  setCoordinates: (coords) => set({ coordinates: coords }),
  setISSPosition: (pos) => set({ issPosition: pos }),
  setISSTLE: (tle) => set({ issTLE: tle }),
  setCelestialBodies: (bodies) => set({ celestialBodies: bodies }),
  setSatellites: (sats) => set({ satellites: sats }),
  setLoading: (loading) => set({ loading }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  setBootComplete: (done) => set({ bootComplete: done }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setTourActive: (active) => set({ tourActive: active, tourIndex: active ? 0 : 0 }),
  setTourIndex: (idx) => set({ tourIndex: idx }),
  toggleAlert: (passId) =>
    set((state) => ({
      alerts: state.alerts.includes(passId)
        ? state.alerts.filter((id) => id !== passId)
        : [...state.alerts, passId],
    })),
}));
