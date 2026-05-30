import { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';

interface GlobeMapProps {
  markers: { coordinates: [number, number]; label: string; active?: boolean }[];
}

export default function GlobeMap({ markers }: GlobeMapProps) {
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  // Update globe size on resize
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('globe-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Set initial position & auto-rotate
  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 1.5;
      
      // Position camera over India (roughly where Dino is)
      globeEl.current.pointOfView({ lat: 20.59, lng: 78.96, altitude: 2.5 }, 2000);
    }
  }, []);

  // Format markers for react-globe.gl
  // Data for the active points
  const pointsData = markers.map(m => ({
    lat: m.coordinates[1],
    lng: m.coordinates[0],
    label: `
      <div style="background: rgba(10,21,32,0.95); padding: 6px 10px; border: 1px solid #1e3a4a; border-radius: 6px; font-family: monospace; color: #00d4ff; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <strong>${m.label}</strong>
      </div>
    `,
    color: m.active ? '#00d4ff' : '#3a5a6a',
    size: m.active ? 1.5 : 0.5
  }));

  // Create arcs from server (New Delhi) to visitors
  const NEW_DELHI = { lat: 28.6139, lng: 77.2090 };
  const arcsData = markers
    .filter(m => m.active)
    .map(m => ({
      startLat: NEW_DELHI.lat,
      startLng: NEW_DELHI.lng,
      endLat: m.coordinates[1],
      endLng: m.coordinates[0],
      color: ['rgba(0,212,255,0.1)', 'rgba(0,212,255,0.9)']
    }));

  // We add New Delhi as a permanent pulsing marker
  const allPoints = [
    { 
      lat: NEW_DELHI.lat, 
      lng: NEW_DELHI.lng, 
      label: `
        <div style="background: rgba(10,21,32,0.95); padding: 6px 10px; border: 1px solid #1e3a4a; border-radius: 6px; font-family: monospace; color: #00ff88; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <strong>Server Origin: New Delhi</strong>
        </div>
      `, 
      color: '#00ff88', 
      size: 2 
    },
    ...pointsData
  ];

  return (
    <div id="globe-container" className="w-full h-full min-h-[300px] flex items-center justify-center opacity-90 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 font-mono text-[10px] text-[#4a6a7a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" /> Server (New Delhi)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" /> Active Visitors
        </div>
      </div>
      
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        
        // Points config
        pointsData={allPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointLabel="label"
        pointAltitude={0.05}
        pointRadius="size"
        pointsMerge={false}
        
        // Arcs config
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        
        // Rings config (pulsing effect for visitors)
        ringsData={allPoints}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius={5}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
      />
    </div>
  );
}
