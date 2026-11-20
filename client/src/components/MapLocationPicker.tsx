import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Locate, Search, Loader2, MapPin } from 'lucide-react';

interface MapLocationPickerProps {
  lat: number;
  lng: number;
  radius?: number;
  onChange: (data: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

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

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  // Custom DivIcon so we don't depend on Leaflet's bundled marker-icon.png
  const customPinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 30px; height: 30px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 34],
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = Number.isFinite(lat) && lat !== 0 ? lat : 28.5355;
    const initialLng = Number.isFinite(lng) && lng !== 0 ? lng : 77.3910;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);

    const circle = L.circle([initialLat, initialLng], {
      radius: radius || 100,
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '4, 4',
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

    // Trigger resize after DOM paints
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

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
          mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
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

  // Search Address / Place via OpenStreetMap Nominatim
  const handleSearchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
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
            mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
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
    <div className={`space-y-2 ${className}`}>
      {/* Map Header / Controls */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchPlace} className="flex-1 flex gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark or landmark address..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-3xs font-bold transition flex items-center gap-1 shrink-0"
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geolocating}
          className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-3xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
        >
          {geolocating ? (
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          ) : (
            <Locate className="w-3 h-3 text-blue-600" />
          )}
          <span>Use My GPS</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-2xs">
        <div ref={mapContainerRef} className="w-full h-56 sm:h-64 z-0 bg-slate-100" />

        {/* Live Address & Coord Badge Overlay */}
        <div className="absolute top-2 right-2 z-[400] flex flex-col items-end gap-1 pointer-events-none">
          <div className="bg-slate-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-3xs font-mono shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {lat.toFixed(5)}°, {lng.toFixed(5)}°
            </span>
          </div>
          {resolvingAddress && (
            <div className="bg-blue-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded text-4xs font-semibold shadow-md flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span>Fetching street address...</span>
            </div>
          )}
        </div>

        {/* Helper Hint */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs text-slate-700 text-4xs px-2 py-1 rounded border border-slate-200/80 shadow-xs flex items-center gap-1 pointer-events-none">
          <MapPin className="w-2.5 h-2.5 text-blue-600 shrink-0" />
          <span>Click anywhere or drag the blue pin to set site position</span>
        </div>
      </div>
    </div>
  );
};
