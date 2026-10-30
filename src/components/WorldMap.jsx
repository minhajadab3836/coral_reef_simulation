import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Play, Pause, RotateCcw, FastForward, Info, MapPin } from 'lucide-react';

const STATE_COLORS = [
  '#10B981', // 0: Healthy (emerald-500)
  '#F59E0B', // 1: Stressed (amber-500)
  '#F43F5E', // 2: Bleached (rose-500)
  '#475569'  // 3: Dead (slate-600)
];

const STATE_NAMES = ['Healthy', 'Stressed', 'Bleached', 'Dead'];

export function WorldMap({
  reefs = [],
  simulationData = null,
  currentYear = 0,
  onYearChange,
  horizonYears = 50
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const canvasRendererRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [basemapMode, setBasemapMode] = useState('dark'); // 'dark' | 'satellite'
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x, 5x
  const [hoveredReef, setHoveredReef] = useState(null);

  // Basemap URLs (100% free, public educational access, NO API key required, NO watermarks)
  const TILE_URLS = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Dark minimalist basemap emphasizing oceans and reef geographies
    const map = L.map(mapContainerRef.current, {
      center: [5.0, 115.0], // Centered around Indo-Pacific / Coral Triangle
      zoom: 3,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true
    });

    // Public Esri World Base Map (Zero API Key, Zero Watermark)
    const baseTile = L.tileLayer(TILE_URLS.dark, {
      maxZoom: 16,
      attribution: '&copy; Esri &bull; NOAA Coral Reef Watch'
    }).addTo(map);

    tileLayerRef.current = baseTile;

    // Attribution subtle in bottom-right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; Esri &bull; NOAA Coral Reef Watch')
      .addTo(map);

    canvasRendererRef.current = L.canvas({ padding: 0.5 });
    mapInstanceRef.current = map;

    // Invalidate size to guarantee perfect layout bounds
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap layer dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const newTile = L.tileLayer(TILE_URLS[basemapMode], {
      maxZoom: 16,
      attribution: '&copy; Esri &bull; NOAA Coral Reef Watch'
    }).addTo(map);

    // Bring marker canvas to front
    if (canvasRendererRef.current) {
      canvasRendererRef.current._container?.parentNode?.appendChild(canvasRendererRef.current._container);
    }

    tileLayerRef.current = newTile;
  }, [basemapMode]);

  // Create markers when reefs load
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !reefs.length) return;

    // Clear existing
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const renderer = canvasRendererRef.current || L.canvas({ padding: 0.5 });

    const newMarkers = reefs.map((reef, idx) => {
      const marker = L.circleMarker([reef.lat, reef.lon], {
        renderer,
        radius: 4.5,
        fillColor: STATE_COLORS[reef.initial_state],
        color: '#ffffff',
        weight: 0.5,
        opacity: 0.8,
        fillOpacity: 0.9
      });

      marker.on('mouseover', () => {
        setHoveredReef({
          ...reef,
          index: idx
        });
      });

      marker.on('mouseout', () => {
        setHoveredReef(null);
      });

      marker.addTo(map);
      return marker;
    });

    markersRef.current = newMarkers;
  }, [reefs]);

  // Update marker colors when currentYear or simulationData changes
  useEffect(() => {
    if (!simulationData || !markersRef.current.length || !reefs.length) return;

    const { reefStatesByYear } = simulationData;
    const N = reefs.length;
    const offset = currentYear * N;

    markersRef.current.forEach((marker, i) => {
      const state = reefStatesByYear[offset + i];
      const color = STATE_COLORS[state] || STATE_COLORS[0];
      marker.setStyle({
        fillColor: color,
        color: state === 3 ? '#1e293b' : '#ffffff'
      });
    });
  }, [currentYear, simulationData, reefs]);

  // Animation player loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(100, Math.floor(600 / playSpeed));
    const timer = setInterval(() => {
      onYearChange(prevYear => {
        if (prevYear >= horizonYears) {
          setIsPlaying(false);
          return horizonYears;
        }
        return prevYear + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, horizonYears, onYearChange]);

  // Calculate global summary counts for current year
  const stateCounts = useMemo(() => {
    if (!simulationData || !reefs.length) {
      return { healthy: 0, stressed: 0, bleached: 0, dead: 0, total: 0 };
    }
    const { reefStatesByYear } = simulationData;
    const N = reefs.length;
    const offset = currentYear * N;
    const counts = [0, 0, 0, 0];

    for (let i = 0; i < N; i++) {
      const s = reefStatesByYear[offset + i];
      counts[s] = (counts[s] || 0) + 1;
    }

    return {
      healthy: ((counts[0] / N) * 100).toFixed(1),
      stressed: ((counts[1] / N) * 100).toFixed(1),
      bleached: ((counts[2] / N) * 100).toFixed(1),
      dead: ((counts[3] / N) * 100).toFixed(1),
      total: N
    };
  }, [simulationData, currentYear, reefs]);

  // Current state of hovered reef at currentYear
  const hoveredCurrentState = useMemo(() => {
    if (!hoveredReef || !simulationData) return null;
    const { reefStatesByYear } = simulationData;
    const N = reefs.length;
    const stateIdx = reefStatesByYear[currentYear * N + hoveredReef.index];
    return {
      stateCode: stateIdx,
      name: STATE_NAMES[stateIdx],
      color: STATE_COLORS[stateIdx]
    };
  }, [hoveredReef, simulationData, currentYear, reefs]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b1320] select-none overflow-hidden">
      {/* Top Map Status Banner & Basemap Selector */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center space-x-2">
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg px-3 py-1.5 shadow-lg flex items-center space-x-3 text-xs text-white">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-neutral-200">Global Spatial Grid</span>
          </div>
          <span className="text-neutral-500">|</span>
          <span className="font-mono text-neutral-300">
            Year {currentYear} of {horizonYears}
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400">
            Forecast Horizon: <strong className="text-white font-mono">{2024 + currentYear}</strong>
          </span>
        </div>

        {/* Basemap Toggle (Zero API Key) */}
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-0.5 shadow-lg flex items-center text-[11px] font-medium text-white">
          <button
            type="button"
            onClick={() => setBasemapMode('dark')}
            className={`px-2 py-1 rounded transition-colors ${
              basemapMode === 'dark'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Dark Canvas
          </button>
          <button
            type="button"
            onClick={() => setBasemapMode('satellite')}
            className={`px-2 py-1 rounded transition-colors ${
              basemapMode === 'satellite'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Satellite Ocean
          </button>
        </div>
      </div>

      {/* Hover Reef Inspector Card (Top Right) */}
      {hoveredReef && hoveredCurrentState && (
        <div className="absolute top-3 right-3 z-[1000] w-72 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-lg p-3 shadow-2xl text-xs text-white">
          <div className="flex items-start justify-between border-b border-neutral-800 pb-2 mb-2">
            <div>
              <h4 className="font-semibold text-neutral-100 truncate w-48" title={hoveredReef.name}>
                {hoveredReef.name}
              </h4>
              <p className="text-[11px] text-neutral-400">
                {hoveredReef.country} &bull; {hoveredReef.ocean}
              </p>
            </div>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${hoveredCurrentState.color}22`,
                color: hoveredCurrentState.color,
                border: `1px solid ${hoveredCurrentState.color}66`
              }}
            >
              {hoveredCurrentState.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-neutral-400">Coordinates:</span>
              <span className="ml-1 font-mono text-neutral-200">
                {hoveredReef.lat.toFixed(1)}°, {hoveredReef.lon.toFixed(1)}°
              </span>
            </div>
            <div>
              <span className="text-neutral-400">Depth:</span>
              <span className="ml-1 font-mono text-neutral-200">{hoveredReef.depth_m} m</span>
            </div>
            <div>
              <span className="text-neutral-400">Turbidity:</span>
              <span className="ml-1 font-mono text-neutral-200">{hoveredReef.turbidity}</span>
            </div>
            <div>
              <span className="text-neutral-400">Exposure:</span>
              <span className="ml-1 font-mono text-neutral-200">{hoveredReef.exposure}</span>
            </div>
            <div>
              <span className="text-neutral-400">Baseline Bleach:</span>
              <span className="ml-1 font-mono text-neutral-200">{hoveredReef.baseline_bleaching}%</span>
            </div>
            <div>
              <span className="text-neutral-400">Surveys:</span>
              <span className="ml-1 font-mono text-neutral-200">{hoveredReef.observations_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full" />

      {/* Bottom Floating Control Bar: Timeline Scrubber + State Summary */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-col space-y-2 pointer-events-none">
        {/* Metric Badges */}
        <div className="flex items-center justify-between px-1 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-md px-2.5 py-1 text-xs shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-neutral-400">Healthy:</span>
              <span className="font-mono font-medium text-emerald-400">{stateCounts.healthy}%</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-md px-2.5 py-1 text-xs shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-neutral-400">Stressed:</span>
              <span className="font-mono font-medium text-amber-400">{stateCounts.stressed}%</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-md px-2.5 py-1 text-xs shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-neutral-400">Bleached:</span>
              <span className="font-mono font-medium text-rose-400">{stateCounts.bleached}%</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-md px-2.5 py-1 text-xs shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="text-neutral-400">Dead / Collapsed:</span>
              <span className="font-mono font-medium text-slate-300">{stateCounts.dead}%</span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 bg-neutral-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-neutral-800">
            Click & drag to explore oceans &bull; Hover dots for site telemetry
          </div>
        </div>

        {/* Apple-style Timeline Bar */}
        <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl p-3 shadow-2xl flex items-center space-x-4 pointer-events-auto">
          {/* Play/Pause & Reset */}
          <div className="flex items-center space-x-1 border-r border-neutral-800 pr-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
              title={isPlaying ? 'Pause' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                onYearChange(0);
              }}
              className="w-8 h-8 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              title="Reset to Year 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Toggle */}
          <div className="flex items-center bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700/60 text-[11px] font-mono">
            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => setPlaySpeed(spd)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  playSpeed === spd
                    ? 'bg-neutral-700 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Scrubber Slider */}
          <div className="flex-1 flex items-center space-x-3">
            <span className="text-xs font-mono text-neutral-400 w-12 text-right">Yr {currentYear}</span>
            <input
              type="range"
              min="0"
              max={horizonYears}
              step="1"
              value={currentYear}
              onChange={e => onYearChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
            <span className="text-xs font-mono text-neutral-400 w-12">Yr {horizonYears}</span>
          </div>

          {/* Quick jump milestone tags */}
          <div className="hidden lg:flex items-center space-x-1 pl-2 border-l border-neutral-800">
            {[0, 10, 25, 50].map(yr => (
              <button
                key={yr}
                onClick={() => onYearChange(yr)}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                  currentYear === yr
                    ? 'bg-neutral-800 text-emerald-400 border-neutral-700'
                    : 'bg-transparent text-neutral-500 border-neutral-800 hover:text-neutral-300'
                }`}
              >
                Y{yr}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
