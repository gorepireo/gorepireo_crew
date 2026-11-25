import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Locate, Search, Loader2, MapPin, Layers } from 'lucide-react';

interface MapLocationPickerProps {
  lat: number;
  lng: number;
  radius?: number;
  onChange: (data: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

type MapLayerMode = 'ROADMAP' | 'HYBRID';

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  lat,
  lng,
  radius = 100,
  onChange,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [layerMode, setLayerMode] = useState<MapLayerMode>('ROADMAP');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  // Custom DivIcon so we don't depend on Leaflet's bundled marker-icon.png
  const customPinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(16, 110, 232, 0.30); animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 30px; height: 30px; background: #ea4335; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 35],
  });

  // Reverse geocode lat/lng to human readable address
  const fetchAddress = useCallback(
    async (latitude: number, longitude: number) => {
      setResolvingAddress(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.display_name) {
            onChange({ lat: latitude, lng: longitude, address: data.display_name });
            return;
          }
        }
      } catch (err) {
        console.warn('[MAP-PICKER] Reverse geocode lookup error:', err);
      } finally {
        setResolvingAddress(false);
      }
      onChange({ lat: latitude, lng: longitude });
    },
    [onChange]
  );

  // Initialize Map with Real Google Map Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = Number.isFinite(lat) && lat !== 0 ? lat : 28.5355;
    const initialLng = Number.isFinite(lng) && lng !== 0 ? lng : 77.3910;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const googleLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 21,
    }).addTo(map);
    tileLayerRef.current = googleLayer;

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);

    const circle = L.circle([initialLat, initialLng], {
      radius: radius || 100,
      color: '#106ee8',
      fillColor: '#106ee8',
      fillOpacity: 0.16,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      circle.setLatLng(pos);
      fetchAddress(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Switch Google Map Tile Layer (Roadmap <-> Satellite Hybrid)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const lyrs = layerMode === 'HYBRID' ? 'y' : 'm';
    tileLayerRef.current.setUrl(`https://mt{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`);
  }, [layerMode]);

  // Sync radius changes to circle
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius || 100);
    }
  }, [radius]);

  // Sync external lat/lng changes if map exists
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        circleRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: true });
      }
    }
  }, [lat, lng]);

  // Use Browser GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          circleRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 17, { animate: true });
        }
        fetchAddress(newLat, newLng);
      },
      (err) => {
        setGeolocating(false);
        alert(`Could not acquire GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Address / Place via Nominatim
  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );
      if (resp.ok) {
        const results = await resp.json();
        if (results && results.length > 0) {
          const item = results[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            circleRef.current.setLatLng([newLat, newLng]);
            mapInstanceRef.current.setView([newLat, newLng], 17, { animate: true });
          }
          onChange({ lat: newLat, lng: newLng, address: item.display_name });
          setSearchQuery('');
        } else {
          alert('No matching places found. Try another search or click on the map.');
        }
      }
    } catch (err: any) {
      console.warn('[MAP-PICKER] Place search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Brand-new Search & GPS Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchPlace();
                }
              }}
              placeholder="Search place, street, or landmark..."
              className="w-full pl-8.5 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#106ee8] focus:bg-white transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchPlace}
            disabled={searching}
            className="px-3.5 py-2 bg-[#106ee8] hover:bg-[#0d5ec9] text-white rounded-xl text-3xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geolocating}
          className="px-3 py-2 bg-[#edf2fe] hover:bg-[#dfe9fd] border border-blue-200/80 text-[#106ee8] rounded-xl text-3xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          {geolocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#106ee8]" />
          ) : (
            <Locate className="w-3.5 h-3.5 text-[#106ee8]" />
          )}
          <span>My GPS</span>
        </button>
      </div>

      {/* Google Map Tile Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-60 sm:h-72 z-0 bg-slate-100" />

        {/* Top-Left: Map / Satellite Layer Toggle */}
        <div className="absolute top-2.5 left-2.5 z-[400] bg-white/95 backdrop-blur-xs rounded-xl p-0.5 shadow-md border border-slate-200/80 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setLayerMode('ROADMAP')}
            className={`px-2.5 py-1 rounded-lg text-4xs font-bold transition flex items-center gap-1 cursor-pointer ${
              layerMode === 'ROADMAP'
                ? 'bg-[#106ee8] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>Map</span>
          </button>
          <button
            type="button"
            onClick={() => setLayerMode('HYBRID')}
            className={`px-2.5 py-1 rounded-lg text-4xs font-bold transition cursor-pointer ${
              layerMode === 'HYBRID'
                ? 'bg-[#106ee8] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Top-Right: Live Coordinates & Geofence Pill */}
        <div className="absolute top-2.5 right-2.5 z-[400] flex flex-col items-end gap-1 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-4xs font-mono shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {lat.toFixed(5)}°, {lng.toFixed(5)}° · {radius}m
            </span>
          </div>
          {resolvingAddress && (
            <div className="bg-[#106ee8]/95 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full text-4xs font-semibold shadow-md flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Resolving address...</span>
            </div>
          )}
        </div>

        {/* Bottom-Left: Helper Hint */}
        <div className="absolute bottom-2.5 left-2.5 z-[400] bg-white/95 backdrop-blur-xs text-slate-700 text-4xs font-medium px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs flex items-center gap-1 pointer-events-none">
          <MapPin className="w-3 h-3 text-[#ea4335] shrink-0" />
          <span>Click or drag pin to set site geofence</span>
        </div>
      </div>
    </div>
  );
};
