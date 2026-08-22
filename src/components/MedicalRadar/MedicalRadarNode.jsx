import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  LocateFixed, 
  RefreshCw, 
  Navigation, 
  Navigation2, 
  PhoneCall, 
  Building2, 
  Stethoscope, 
  TestTube2, 
  Pill, 
  Search, 
  Radio, 
  Layers, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { 
  getUserLocation, 
  reverseGeocodeCity, 
  fetchNearbyMedicalPlaces 
} from '../../services/medicalPlacesService';

const CATEGORIES = [
  { id: 'all', label: 'All Places', emoji: '🌟', color: '#0f766e' },
  { id: 'hospital', label: 'Hospitals', emoji: '🏥', color: '#0f766e' },
  { id: 'doctor', label: 'Doctors & Clinics', emoji: '👨‍⚕️', color: '#2563eb' },
  { id: 'lab', label: 'Diagnostic Labs', emoji: '🔬', color: '#8b5cf6' },
  { id: 'pharmacy', label: 'Pharmacies', emoji: '💊', color: '#10b981' }
];

export default function MedicalRadarNode({ defaultCity = 'Detecting Location...', onOpenEmergency = null, onBackHome = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const placesMarkersMapRef = useRef(new Map());

  // State
  const [userCoords, setUserCoords] = useState({ lat: 28.6692, lng: 77.4538 }); // Live locator default
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState(10000); // 10km default
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState(defaultCity);
  const [activePlaceId, setActivePlaceId] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    let timer = setTimeout(() => {
      if (!window.L || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        try {
          const map = window.L.map(mapRef.current, {
            zoomControl: true,
            attributionControl: false
          }).setView([userCoords.lat, userCoords.lng], 13);

          window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18
          }).addTo(map);

          markersGroupRef.current = window.L.layerGroup().addTo(map);
          mapInstanceRef.current = map;

          // Auto-trigger GPS detection & nearby search
          detectAndLoadPlaces();
        } catch (e) {
          console.error("Leaflet initialization error in Radar Node:", e);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Plot places and user marker
  const plotPlacesOnMap = (places, coords = null) => {
    if (!window.L || !mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();
    placesMarkersMapRef.current.clear();

    const uLat = coords?.lat || userCoords.lat;
    const uLng = coords?.lng || userCoords.lng;

    // User GPS Live Marker
    if (uLat && uLng) {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch(e) {}
      }
      const userIcon = window.L.divIcon({
        className: 'user-live-pin',
        html: '<div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;"><div style="position:absolute; width:22px; height:22px; border-radius:50%; background:#2563eb; opacity:0.35; animation:pulse-status 1.5s infinite;"></div><div style="width:13px; height:13px; border-radius:50%; background:#2563eb; border:2.5px solid white; box-shadow:0 0 10px rgba(37,99,235,0.9);"></div></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      userMarkerRef.current = window.L.marker([uLat, uLng], { icon: userIcon })
        .bindPopup(`<div style="font-family:sans-serif; font-size:11px;"><strong>📍 Your Current Location</strong><br><span style="color:#64748b;">${locationAddress || 'Detected Location'}</span></div>`)
        .addTo(mapInstanceRef.current);
    }

    // Facility Markers
    places.forEach((place) => {
      if (!place.lat || !place.lng) return;

      let bgColor = '#0f766e';
      let shadowColor = 'rgba(15,118,110,0.6)';
      let pulseColor = 'rgba(15,118,110,0.25)';
      let emoji = '🏥';
      let tagLabel = 'HOSPITAL';

      if (place.type === 'doctor') {
        bgColor = '#2563eb';
        shadowColor = 'rgba(37,99,235,0.6)';
        pulseColor = 'rgba(37,99,235,0.25)';
        emoji = '👨‍⚕️';
        tagLabel = 'DOCTOR / CLINIC';
      } else if (place.type === 'lab') {
        bgColor = '#8b5cf6';
        shadowColor = 'rgba(139,92,246,0.6)';
        pulseColor = 'rgba(139,92,246,0.25)';
        emoji = '🔬';
        tagLabel = 'DIAGNOSTIC LAB';
      } else if (place.type === 'pharmacy') {
        bgColor = '#10b981';
        shadowColor = 'rgba(16,185,129,0.6)';
        pulseColor = 'rgba(16,185,129,0.25)';
        emoji = '💊';
        tagLabel = 'PHARMACY';
      }

      const iconHtml = `
        <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="${place.name}">
          <div style="position:absolute; width:32px; height:32px; border-radius:50%; background:${pulseColor}; animation:pulse-status 2s infinite;"></div>
          <div style="width:26px; height:26px; border-radius:50%; background:${bgColor}; border:2.5px solid white; box-shadow:0 3px 10px ${shadowColor}; display:flex; align-items:center; justify-content:center; font-size:12px; transform:translateZ(0); text-shadow:0 1px 2px rgba(0,0,0,0.2);">
            ${emoji}
          </div>
        </div>
      `;

      const icon = window.L.divIcon({
        className: `custom-medical-pin ${place.type}-pin`,
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; min-width: 220px; color: #0f172a; padding: 2px;">
          <div style="font-size: 9px; font-weight: 700; color: ${bgColor}; text-transform: uppercase; margin-bottom: 2px; display:flex; align-items:center; gap:4px;">
            <span>${emoji}</span>
            <span>${tagLabel}</span>
          </div>
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 3px; line-height: 1.25; color:#0f172a;">${place.name}</div>
          <div style="color: #64748b; font-size: 10px; margin-bottom: 4px; line-height: 1.3;">${place.address}</div>
          <div style="font-weight: 600; color: #0f766e; font-size: 11px; margin-bottom: 6px;">📏 ${place.distanceKm} (${place.drivingTime})</div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <a href="tel:${place.phone}" style="flex: 1; text-align: center; background: #0f766e; color: white; padding: 6px 8px; border-radius: 8px; text-decoration: none; font-size: 10px; font-weight: 700;">📞 Call</a>
            <a href="${place.directionsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #2563eb; color: white; padding: 6px 8px; border-radius: 8px; text-decoration: none; font-size: 10px; font-weight: 700;">🗺️ Route</a>
          </div>
        </div>
      `;

      const marker = window.L.marker([place.lat, place.lng], { icon })
        .bindPopup(popupContent)
        .addTo(markersGroupRef.current);
      
      placesMarkersMapRef.current.set(place.id, marker);
    });
  };

  // Detect GPS & fetch nearby
  const detectAndLoadPlaces = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await getUserLocation();
      if (loc && loc.lat && loc.lng) {
        setUserCoords({ lat: loc.lat, lng: loc.lng });

        const geoInfo = await reverseGeocodeCity(loc.lat, loc.lng);
        const addr = geoInfo.formattedAddress || geoInfo.city;
        setLocationAddress(addr);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([loc.lat, loc.lng], 14);
        }

        const places = await fetchNearbyMedicalPlaces(loc.lat, loc.lng, selectedCategory, searchRadius);
        setNearbyPlaces(places);
        plotPlacesOnMap(places, { lat: loc.lat, lng: loc.lng });
      }
    } catch (e) {
      console.error("GPS detection error:", e);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Change category
  const handleCategoryChange = async (catId) => {
    setSelectedCategory(catId);
    setIsDetectingLocation(true);
    try {
      const places = await fetchNearbyMedicalPlaces(userCoords.lat, userCoords.lng, catId, searchRadius);
      setNearbyPlaces(places);
      plotPlacesOnMap(places);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Change Radius
  const handleRadiusChange = async (newRadius) => {
    setSearchRadius(newRadius);
    setIsDetectingLocation(true);
    try {
      const places = await fetchNearbyMedicalPlaces(userCoords.lat, userCoords.lng, selectedCategory, newRadius);
      setNearbyPlaces(places);
      plotPlacesOnMap(places);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Focus Place on map
  const handleSelectPlace = (place) => {
    setActivePlaceId(place.id);
    if (!mapInstanceRef.current || !place.lat || !place.lng) return;
    mapInstanceRef.current.flyTo([place.lat, place.lng], 16, { animate: true, duration: 0.8 });
    const marker = placesMarkersMapRef.current.get(place.id);
    if (marker) {
      setTimeout(() => marker.openPopup(), 400);
    }
  };

  // Filtered by search text
  const displayedPlaces = nearbyPlaces.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg relative overflow-hidden font-sans select-none">
      {/* Node Top Navigation Bar */}
      <header className="h-[74px] bg-white border-b border-brand-border px-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          {onBackHome && (
            <button
              onClick={onBackHome}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95 border border-slate-200"
              title="Return to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-[#0f766e]/10 border border-[#0f766e]/20 flex items-center justify-center text-[#0f766e] shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#0f766e] border border-emerald-200 uppercase">
                NODE 03 • SPATIAL CARE RADAR
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE SATELLITE & GPS
              </span>
            </div>
            <h2 className="text-sm font-bold text-brand-textDark mt-0.5">
              Verified Medical Facilities & Specialist Router
            </h2>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Detected GPS location badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="max-w-[200px] truncate font-bold">{locationAddress}</span>
          </div>

          {/* Re-Detect GPS button */}
          <button
            onClick={detectAndLoadPlaces}
            disabled={isDetectingLocation}
            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645e] disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all active:scale-95"
            title="Auto-Detect Live Location"
          >
            {isDetectingLocation ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Radar...</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                <span>Locate My GPS</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Node Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Directory & Controls */}
        <div className="w-[420px] bg-brand-sand border-r border-brand-border flex flex-col shrink-0 overflow-hidden">
          
          {/* Search & Category Filter Controls */}
          <div className="p-4 bg-white/70 backdrop-blur-sm border-b border-brand-border flex flex-col gap-3">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search hospital, specialist doctor, lab..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-brand-border rounded-xl text-xs outline-none focus:border-[#0f766e] text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#0f766e] text-white shadow-sm'
                      : 'bg-white border border-brand-border text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Radius & Count Status Row */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <strong>{displayedPlaces.length}</strong> Facilities Found
              </span>
              <div className="flex items-center gap-1">
                <span>Radius:</span>
                <select
                  value={searchRadius}
                  onChange={e => handleRadiusChange(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-[#0f766e] outline-none"
                >
                  <option value={3000}>3 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={15000}>15 km</option>
                </select>
              </div>
            </div>
          </div>

          {/* Places List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isDetectingLocation ? (
              <div className="bg-white border border-brand-border rounded-2xl p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#0f766e]" />
                <p className="font-bold text-slate-700">Scanning Satellite Radar...</p>
                <p className="text-[10px] text-slate-400 mt-1">Filtering verified healthcare facilities</p>
              </div>
            ) : displayedPlaces.length === 0 ? (
              <div className="bg-white border border-brand-border rounded-2xl p-8 text-center text-slate-400 text-xs">
                <Compass className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No medical places matched</p>
                <p className="text-[10px] text-slate-400 mt-1">Try expanding search radius or changing category</p>
              </div>
            ) : (
              displayedPlaces.map((place) => {
                const isActive = activePlaceId === place.id;
                let typeBadge = 'bg-teal-50 text-[#0f766e] border-teal-200';
                let typeLabel = 'HOSPITAL';
                let typeEmoji = '🏥';

                if (place.type === 'doctor') {
                  typeBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  typeLabel = 'DOCTOR / CLINIC';
                  typeEmoji = '👨‍⚕️';
                } else if (place.type === 'lab') {
                  typeBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                  typeLabel = 'DIAGNOSTIC LAB';
                  typeEmoji = '🔬';
                } else if (place.type === 'pharmacy') {
                  typeBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  typeLabel = 'PHARMACY';
                  typeEmoji = '💊';
                }

                return (
                  <div
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className={`rounded-2xl p-4 transition-all cursor-pointer flex flex-col gap-2.5 group relative border ${
                      isActive 
                        ? 'bg-white border-[#0f766e] shadow-md ring-2 ring-[#0f766e]/20' 
                        : 'bg-white border-brand-border hover:border-[#0f766e]/40 hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Type & Distance */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${typeBadge}`}>
                        {typeEmoji} {typeLabel}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0f766e]">
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{place.distanceKm}</span>
                        <span className="text-slate-400 font-normal text-[10px]">({place.drivingTime})</span>
                      </div>
                    </div>

                    {/* Facility Name & Address */}
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#0f766e] transition-colors leading-snug">
                        {place.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {place.address}
                      </p>
                    </div>

                    {/* Action Buttons: 1-Click Call & Map Navigation */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                      {/* Phone Call */}
                      <a
                        href={`tel:${place.phone}`}
                        className="flex-1 py-2 px-3 bg-slate-50 hover:bg-[#0f766e] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0f766e] rounded-xl text-[11px] font-bold font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        title={`Call ${place.phone}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-[#0f766e] group-hover:text-white" />
                        <span className="truncate">{place.phone}</span>
                      </a>

                      {/* Google Maps Directions */}
                      <a
                        href={place.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl text-[11px] font-bold font-mono flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shrink-0"
                        title="Open in Google Maps"
                      >
                        <Navigation2 className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                        <span>Route</span>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Full Screen Interactive Leaflet Map */}
        <div className="flex-1 h-full relative bg-slate-100">
          <div ref={mapRef} className="w-full h-full"></div>

          {/* Floating Map Legend & Overlay */}
          <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-lg flex flex-col gap-2 pointer-events-auto text-[11px] font-mono select-none">
            <div className="font-bold text-slate-800 text-[10px] tracking-wider uppercase border-b border-slate-100 pb-1">
              Medical Map Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white shadow-sm"></span>
              <span className="text-slate-600">Your GPS Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0f766e] border border-white shadow-sm"></span>
              <span className="text-slate-600">Hospital / Super Speciality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2563eb] border border-white shadow-sm"></span>
              <span className="text-slate-600">Doctor / Clinic</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#8b5cf6] border border-white shadow-sm"></span>
              <span className="text-slate-600">Diagnostic & Pathology Lab</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981] border border-white shadow-sm"></span>
              <span className="text-slate-600">Pharmacy & Medicos</span>
            </div>
          </div>

          {/* Quick Floating Reset Center button */}
          <button
            onClick={() => {
              if (mapInstanceRef.current && userCoords.lat && userCoords.lng) {
                mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 14);
              }
            }}
            className="absolute bottom-6 right-6 z-[400] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-lg text-xs font-bold font-mono flex items-center gap-2 transition-all active:scale-95"
          >
            <LocateFixed className="w-4 h-4 text-[#0f766e]" />
            <span>Recenter to My GPS</span>
          </button>
        </div>

      </div>
    </div>
  );
}
