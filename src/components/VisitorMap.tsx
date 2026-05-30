import { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';

// Free topojson world map from CDN
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

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
        <div className="relative" style={{ height: '300px' }}>
          <ComposableMap
            projection="geoNaturalEarth1"
            style={{ width: '100%', height: '100%' }}
            projectionConfig={{ scale: 145, center: [10, 10] }}
          >
            <ZoomableGroup>
              {/* Countries */}
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#0d1f2d', stroke: '#1e3a4a', strokeWidth: 0.5, outline: 'none' },
                        hover: { fill: '#0d1f2d', stroke: '#1e3a4a', strokeWidth: 0.5, outline: 'none' },
                        pressed: { fill: '#0d1f2d', stroke: '#1e3a4a', strokeWidth: 0.5, outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Visitor Markers */}
              {loaded &&
                markers.map((marker, i) => {
                  const isHome = i === 0;
                  return (
                    <Marker
                      key={`${marker.alias}-${i}`}
                      coordinates={marker.coordinates}
                      onMouseEnter={(evt) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          const me = evt as unknown as MouseEvent;
                          setTooltip({
                            x: me.clientX - rect.left,
                            y: me.clientY - rect.top,
                            visitor: marker,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Pulse ring */}
                      <circle r={isHome ? 14 : 10} fill={isHome ? '#00ff8820' : '#00d4ff18'} className="animate-ping" style={{ animationDuration: isHome ? '1.5s' : '2s' }} />
                      <circle r={isHome ? 7 : 4} fill={isHome ? '#00ff88' : '#00d4ff'} opacity={0.9} />
                      <circle r={isHome ? 3 : 2} fill="#fff" opacity={0.8} />
                    </Marker>
                  );
                })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg text-xs font-mono border"
              style={{
                left: Math.min(tooltip.x + 12, 300),
                top: Math.max(tooltip.y - 60, 8),
                background: '#0a1520ee',
                border: '1px solid #1e3a4a',
                color: '#D7E2EA',
                minWidth: '160px',
              }}
            >
              <div className="text-[#00d4ff] font-bold">{tooltip.visitor.alias}</div>
              <div className="text-[#6b8899] mt-1">{tooltip.visitor.city}</div>
              <div className="text-[#4a6a7a] text-[10px]">{tooltip.visitor.org}</div>
              <div className="text-[#3a5a6a] text-[10px] mt-1">
                since {new Date(tooltip.visitor.online_at).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-2 right-3 flex flex-col gap-1 text-[10px] font-mono text-[#4a6a7a]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
              <span>rakesh.dev origin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
              <span>active visitor</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VisitorMap;
