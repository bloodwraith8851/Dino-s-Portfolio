import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobeMap from './GlobeMap';

interface VisitorMarker {
  alias: string;
  city: string;
  org: string;
  coordinates: [number, number];
  online_at: string;
}

// Well-known city → approximate [lng, lat] mapping
// Falls back to random known cities for demo purposes
const CITY_COORDS: Record<string, [number, number]> = {
  'New Delhi': [77.1025, 28.7041],
  'Mumbai': [72.8777, 19.0760],
  'Bangalore': [77.5946, 12.9716],
  'Hyderabad': [78.4867, 17.3850],
  'Chennai': [80.2707, 13.0827],
  'Kolkata': [88.3639, 22.5726],
  'Pune': [73.8567, 18.5204],
  'London': [-0.1276, 51.5074],
  'New York': [-74.0059, 40.7128],
  'Los Angeles': [-118.2437, 34.0522],
  'Tokyo': [139.6917, 35.6895],
  'Paris': [2.3522, 48.8566],
  'Berlin': [13.4050, 52.5200],
  'Singapore': [103.8198, 1.3521],
  'Dubai': [55.2708, 25.2048],
  'Sydney': [151.2093, -33.8688],
  'Toronto': [-79.3832, 43.6532],
  'San Francisco': [-122.4194, 37.7749],
  'Chicago': [-87.6298, 41.8781],
  'Seattle': [-122.3320, 47.6062],
  'Amsterdam': [4.9041, 52.3676],
  'Stockholm': [18.0686, 59.3293],
  'Seoul': [126.9780, 37.5665],
  'Shanghai': [121.4737, 31.2304],
  'Beijing': [116.4074, 39.9042],
  'São Paulo': [-46.6333, -23.5505],
  'Mexico City': [-99.1332, 19.4326],
  'Istanbul': [28.9784, 41.0082],
  'Cairo': [31.2357, 30.0444],
  'Lagos': [3.3792, 6.5244],
  'Nairobi': [36.8219, -1.2921],
  'Moscow': [37.6173, 55.7558],
  'Jakarta': [106.8456, -6.2088],
  'Bangkok': [100.5018, 13.7563],
  'Kuala Lumpur': [101.6869, 3.1390],
  'Manila': [120.9842, 14.5995],
  'Hong Kong': [114.1694, 22.3193],
  'Taipei': [121.5654, 25.0330],
  'Vienna': [16.3738, 48.2082],
  'Zurich': [8.5417, 47.3769],
  'Brussels': [4.3517, 50.8503],
  'Warsaw': [21.0122, 52.2297],
  'Bucharest': [26.1025, 44.4268],
  'Athens': [23.7275, 37.9838],
  'Helsinki': [24.9341, 60.1699],
  'Oslo': [10.7522, 59.9139],
  'Copenhagen': [12.5683, 55.6761],
  'Lisbon': [-9.1393, 38.7223],
  'Madrid': [-3.7038, 40.4168],
  'Rome': [12.4964, 41.9028],
  'Milan': [9.1900, 45.4654],
};

function getCityCoords(city: string): [number, number] | null {
  if (!city || city === 'Unknown') return null;
  // Direct match
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // Partial match
  const found = Object.entries(CITY_COORDS).find(([k]) =>
    city.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(city.toLowerCase())
  );
  return found ? found[1] : null;
}

interface TooltipState {
  x: number;
  y: number;
  visitor: VisitorMarker;
}

interface VisitorMapProps {
  onClose: () => void;
}

const VisitorMap = ({ onClose }: VisitorMapProps) => {
  const [markers, setMarkers] = useState<VisitorMarker[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parse global presence data set by Supabase Presence in App.tsx
    const presences: any[] = (window as any).__VISITOR_PRESENCE__ || [];

    const mapped: VisitorMarker[] = presences
      .map((p) => {
        const coords = getCityCoords(p.city || '');
        if (!coords) return null;
        // Add slight jitter so overlapping cities don't stack perfectly
        const jitter = (): number => (Math.random() - 0.5) * 2.5;
        return {
          alias: p.alias || 'Anonymous',
          city: p.city || 'Unknown',
          org: p.org || 'Unknown',
          online_at: p.online_at,
          coordinates: [coords[0] + jitter(), coords[1] + jitter()] as [number, number],
        };
      })
      .filter(Boolean) as VisitorMarker[];

    // Always add New Delhi as the "home" marker (Rakesh's location)
    const home: VisitorMarker = {
      alias: '⚡ rakesh.dev',
      city: 'New Delhi',
      org: 'Server Origin',
      online_at: new Date().toISOString(),
      coordinates: [77.1025, 28.7041],
    };

    setMarkers([home, ...mapped]);
    setLoaded(true);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.3 }}
        className="relative w-full rounded-xl overflow-hidden border border-[#1e3a4a]/60"
        style={{
          background: 'linear-gradient(135deg, #050d13 0%, #0a1520 50%, #050d13 100%)',
          maxHeight: '360px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e3a4a]/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-[#8ab4c4] font-mono uppercase tracking-widest">
              LIVE VISITOR MAP — {markers.length - 1} ONLINE
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#4a6a7a] hover:text-[#D7E2EA] text-xs font-mono transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            [close]
          </button>
        </div>

        {/* Map */}
        <div className="relative w-full h-[300px]">
          {loaded && (
            <GlobeMap 
              markers={markers.map(m => ({
                coordinates: m.coordinates,
                label: `${m.alias} - ${m.city}`,
                active: m.org !== 'Server Origin'
              }))} 
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VisitorMap;
