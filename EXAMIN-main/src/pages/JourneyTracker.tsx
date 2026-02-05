import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, CheckCircle2, Clock, Shield } from 'lucide-react';
import LocationSearch, { type LocationSelection } from '../components/LocationSearch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Types ---
interface Waypoint {
  id: string;               // unique id
  label: string;            // user friendly label (e.g., "Departure", "Midpoint 1")
  otp?: string;             // generated OTP (server side ideally) - stored temporarily client side for demo
  verified: boolean;        // whether user entered OTP
  timestamp?: string;       // ISO timestamp of verification
  coords?: { lat: number; lng: number }; // location at verification
    target?: { lat: number; lng: number; radiusMeters: number; address?: string }; // planned geofence + chosen address
}

interface JourneyState {
  startedAt?: string;
  startCoords?: { lat: number; lng: number };
  waypoints: Waypoint[];
  completed: boolean;
  endedAt?: string;
}

// Simple random 4 digit OTP generator (replace with secure backend endpoint in production)
function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function saveState(state: JourneyState) {
  localStorage.setItem('journey_tracker_state', JSON.stringify(state));
}

function loadState(): JourneyState | null {
  const raw = localStorage.getItem('journey_tracker_state');
  if (!raw) return null;
  try { return JSON.parse(raw) as JourneyState; } catch { return null; }
}

const defaultWaypoints: Waypoint[] = [
  { id: 'depart', label: 'Departure', verified: false },
  { id: 'arrive', label: 'Arrival (Exam Center)', verified: false }
];

const getLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

const JourneyTracker: React.FC = () => {
  const navigate: NavigateFunction = useNavigate();
  const [state, setState] = useState<JourneyState>(() => loadState() || { waypoints: defaultWaypoints, completed: false });
  const [activeWaypointId, setActiveWaypointId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  // New midpoint planning (search + optional custom label)
  const [midpointSelection, setMidpointSelection] = useState<LocationSelection | null>(null);
  const [midpointLabel, setMidpointLabel] = useState('');
  const [liveCoords, setLiveCoords] = useState<{lat:number; lng:number} | null>(null);
  // Manual arrival coordinate entry support

  // Persist state
  useEffect(() => { saveState(state); }, [state]);

  const activeWaypoint = state.waypoints.find(w => w.id === activeWaypointId) || null;

  function startJourney() {
    if (state.startedAt) {
      toast.info('Journey already started.');
      return;
    }
  // Require all waypoints (including departure) have targets before starting
  const missingTargets = state.waypoints.filter(w => !w.target);
    if (missingTargets.length) {
      toast.error('Please set location for all waypoints before starting.');
      return;
    }
    setLoading(true);
    getLocation().then(coords => {
      const startedAt = new Date().toISOString();
      const updated = {
        ...state,
        startedAt,
        startCoords: coords,
      };
      setState(updated);
      toast.success('Journey started. Departure OTP generated.');
      triggerOtp('depart');
      // Start watch position for auto-geofence detection
      const id = navigator.geolocation.watchPosition(
        pos => {
          const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLiveCoords(current);
          autoTriggerGeofences(current);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
      setWatchId(id);
    }).catch(() => {
      toast.error('Unable to fetch location for start.');
    }).finally(() => setLoading(false));
  }

  function triggerOtp(waypointId: string) {
    setState(prev => ({
      ...prev,
      waypoints: prev.waypoints.map(w => w.id === waypointId ? { ...w, otp: generateOtp() } : w)
    }));
    setActiveWaypointId(waypointId);
  }

  function verifyOtp() {
    if (!activeWaypoint) return;
    if (otpInput.trim() === '' || otpInput.length < 4) {
      toast.error('Enter the 4-digit OTP');
      return;
    }
    if (otpInput !== activeWaypoint.otp) {
      toast.error('Incorrect OTP');
      return;
    }
    setLoading(true);
    getLocation().then(coords => {
      setState(prev => ({
        ...prev,
        waypoints: prev.waypoints.map(w => w.id === activeWaypoint.id ? {
          ...w,
          verified: true,
          timestamp: new Date().toISOString(),
          coords
        } : w)
      }));
      toast.success(`${activeWaypoint.label} verified.`);
      setOtpInput('');
      setActiveWaypointId(null);
    }).catch(() => toast.error('Location capture failed.')).finally(() => setLoading(false));
  }

  function markCompleted() {
    if (state.completed) return;
    if (!state.waypoints.every(w => w.verified)) {
      toast.error('Verify all waypoints first.');
      return;
    }
    setState(prev => ({ ...prev, completed: true, endedAt: new Date().toISOString() }));
    toast.success('Journey completed and stored.');
  }

  function resetJourney() {
    if (!confirm('Reset journey tracking?')) return;
    setState({ waypoints: defaultWaypoints, completed: false });
    setActiveWaypointId(null);
    setOtpInput('');
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
  }

  // Cleanup watcher on unmount
  useEffect(() => () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); }, [watchId]);

  // Custom marker icons
  const userIcon = useMemo(() => L.divIcon({
    className: 'live-user-icon',
    html: '<div class="relative"><div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow"></div><div class="absolute w-8 h-8 -left-2 -top-2 bg-emerald-500/20 rounded-full animate-ping"></div></div>',
    iconSize: [16,16]
  }), []);
  const standardIcon = useMemo(() => L.divIcon({
    className: 'waypoint-icon',
    html: '<div class="w-3 h-3 bg-white border-2 border-emerald-600 rounded-full"></div>',
    iconSize: [12,12]
  }), []);

  // Imperative Leaflet map wrapper (avoid react-leaflet to bypass React 19 peer conflict)
  const MapView: React.FC = () => {
    const mapDivRef = React.useRef<HTMLDivElement | null>(null);
    const mapInstance = React.useRef<L.Map | null>(null);
    const layerStore = React.useRef<{ user?: L.Marker; waypoints: Record<string, { circle: L.Circle; marker: L.Marker }>; route?: { complete?: L.Polyline; remaining?: L.Polyline } }>({ waypoints: {} });

    // Initialize map once
    useEffect(() => {
      if (mapDivRef.current && !mapInstance.current) {
        mapInstance.current = L.map(mapDivRef.current).setView(liveCoords || state.startCoords || { lat: 20.5937, lng: 78.9629 }, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);
      }
    }, []);

    // Update user marker
    useEffect(() => {
      if (!mapInstance.current || !liveCoords) return;
      if (!layerStore.current.user) {
        layerStore.current.user = L.marker(liveCoords, { icon: userIcon }).addTo(mapInstance.current).bindPopup('You are here');
      } else {
        layerStore.current.user.setLatLng(liveCoords);
      }
    }, [liveCoords, userIcon]);

    // Sync waypoint layers + route polylines
    useEffect(() => {
      if (!mapInstance.current) return;
      const map = mapInstance.current;
      const existing = layerStore.current.waypoints;
      const keep = new Set<string>();
      state.waypoints.forEach(w => {
        if (!w.target) return;
        keep.add(w.id);
        const color = w.verified ? '#059669' : '#10b981';
        if (!existing[w.id]) {
          const circle = L.circle([w.target.lat, w.target.lng], { radius: w.target.radiusMeters, color, fillColor: color, fillOpacity: 0.15 }).addTo(map);
          const marker = L.marker([w.target.lat, w.target.lng], { icon: standardIcon })
            .addTo(map)
            .bindPopup(`<strong>${w.label}</strong><br/>Radius: ${w.target.radiusMeters}m<br/>${w.verified ? 'Verified' : (w.otp ? 'OTP Generated' : 'Pending')}`);
          existing[w.id] = { circle, marker };
        } else {
          existing[w.id].circle.setStyle({ color, fillColor: color }).setLatLng([w.target.lat, w.target.lng]).setRadius(w.target.radiusMeters);
          existing[w.id].marker.setLatLng([w.target.lat, w.target.lng]);
          existing[w.id].marker._popup?.setContent(`<strong>${w.label}</strong><br/>Radius: ${w.target.radiusMeters}m<br/>${w.verified ? 'Verified' : (w.otp ? 'OTP Generated' : 'Pending')}`);
        }
      });
      Object.keys(existing).forEach(id => {
        if (!keep.has(id)) {
          existing[id].circle.remove();
          existing[id].marker.remove();
          delete existing[id];
        }
      });

      // Route polylines
      const targets = state.waypoints.map(w => w.target ? [w.target.lat, w.target.lng] : null).filter(Boolean) as [number, number][];
      const lastVerifiedIdx = state.waypoints.reduce((acc, w, idx) => w.verified ? idx : acc, -1);
      if (targets.length >= 2) {
        if (!layerStore.current.route) layerStore.current.route = {};
        const completedTargets = state.waypoints.filter((_, idx) => idx <= lastVerifiedIdx && idx >= 0).map(w => w.target).filter(Boolean) as {lat:number; lng:number}[];
        const remainingTargets = state.waypoints.filter((_, idx) => idx >= Math.max(lastVerifiedIdx, 0)).map(w => w.target).filter(Boolean) as {lat:number; lng:number}[];

        if (completedTargets.length >= 2) {
          const pts = completedTargets.map(t => [t.lat, t.lng]) as [number, number][];
          if (!layerStore.current.route.complete) {
            layerStore.current.route.complete = L.polyline(pts, { color: '#059669', weight: 5 }).addTo(map);
          } else {
            layerStore.current.route.complete.setLatLngs(pts);
          }
        } else if (layerStore.current.route?.complete) {
          layerStore.current.route.complete.remove();
          layerStore.current.route.complete = undefined;
        }

        if (remainingTargets.length >= 2) {
          const pts = remainingTargets.map(t => [t.lat, t.lng]) as [number, number][];
          if (!layerStore.current.route.remaining) {
            layerStore.current.route.remaining = L.polyline(pts, { color: '#64748b', weight: 4, dashArray: '6 8' }).addTo(map);
          } else {
            layerStore.current.route.remaining.setLatLngs(pts);
          }
        } else if (layerStore.current.route?.remaining) {
          layerStore.current.route.remaining.remove();
          layerStore.current.route.remaining = undefined;
        }

        if (!state.startedAt) {
          const bounds = L.latLngBounds(targets.map(t => L.latLng(t[0], t[1])));
          map.fitBounds(bounds.pad(0.2));
        }
      } else {
        if (layerStore.current.route?.complete) { layerStore.current.route.complete.remove(); layerStore.current.route.complete = undefined; }
        if (layerStore.current.route?.remaining) { layerStore.current.route.remaining.remove(); layerStore.current.route.remaining = undefined; }
      }
    }, [state.waypoints, standardIcon]);

    return <div ref={mapDivRef} className="h-full w-full" />;
  };

  // Distance between two coords (meters)
  function haversine(a: {lat:number; lng:number}, b:{lat:number; lng:number}) {
    const R = 6371000; // m
    const dLat = (b.lat - a.lat) * Math.PI/180;
    const dLng = (b.lng - a.lng) * Math.PI/180;
    const la1 = a.lat * Math.PI/180;
    const la2 = b.lat * Math.PI/180;
    const sinDLat = Math.sin(dLat/2);
    const sinDLng = Math.sin(dLng/2);
    const h = sinDLat*sinDLat + Math.cos(la1)*Math.cos(la2)*sinDLng*sinDLng;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  // Auto geofence trigger
  function autoTriggerGeofences(current:{lat:number; lng:number}) {
    setState(prev => {
      let changed = false;
      const updated = prev.waypoints.map(w => {
        if (!w.verified && !w.otp && w.target) {
          const dist = haversine(current, { lat: w.target.lat, lng: w.target.lng });
            if (dist <= w.target.radiusMeters) {
              changed = true;
              return { ...w, otp: generateOtp() };
            }
        }
        return w;
      });
      if (changed) {
        // Find first newly triggered to set active & notify
        const newly = updated.find(w => w.otp && !prev.waypoints.find(pw => pw.id === w.id)?.otp);
        if (newly) {
          toast.info(`${newly.label} OTP auto-generated (within ${newly.target?.radiusMeters}m).`);
          setActiveWaypointId(newly.id);
        }
      }
      return changed ? { ...prev, waypoints: updated } : prev;
    });
  }

  // Planning helpers (structured: departure & arrival first)
  function addWaypoint() {
    if (!midpointSelection) {
      toast.error('Select a midpoint location first.');
      return;
    }
    const dep = state.waypoints.find(w => w.id === 'depart')?.target;
    const arr = state.waypoints.find(w => w.id === 'arrive')?.target;
    if (!dep || !arr) {
      toast.error('Set departure & arrival first.');
      return;
    }
    const derivedLabel = midpointLabel.trim() || midpointSelection.address.split(',')[0] || 'Midpoint';
    setState(prev => ({
      ...prev,
      waypoints: [
        prev.waypoints[0],
        ...prev.waypoints.slice(1, prev.waypoints.length - 1),
  { id: crypto.randomUUID(), label: derivedLabel, verified: false, target: { lat: midpointSelection.lat, lng: midpointSelection.lng, radiusMeters: 150, address: midpointSelection.address } },
        prev.waypoints[prev.waypoints.length - 1]
      ]
    }));
    setMidpointSelection(null);
    setMidpointLabel('');
    toast.success('Midpoint added.');
  }

  function captureTarget(id:string) {
    getLocation().then(coords => {
      setState(prev => ({
        ...prev,
        waypoints: prev.waypoints.map(w => w.id === id ? {
          ...w,
          target: { lat: coords.lat, lng: coords.lng, radiusMeters: w.target?.radiusMeters || 150 }
        } : w)
      }));
      toast.success('Waypoint location saved.');
    }).catch(() => toast.error('Could not capture location'));
  }

  function updateRadius(id:string, radius:number) {
    setState(prev => ({
      ...prev,
      waypoints: prev.waypoints.map(w => w.id === id ? (
        w.target ? { ...w, target: { ...w.target, radiusMeters: radius } } : w
      ) : w)
    }));
    const wp = state.waypoints.find(w => w.id === id);
    if (!wp?.target) toast.warning('Capture location before adjusting radius.');
  }


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-7 w-7 text-emerald-600" /> Journey Progress Tracker
          </h1>
          <div className="flex gap-3">
            {!state.startedAt && (
              <button onClick={startJourney} disabled={loading} className="px-5 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {loading ? 'Starting...' : 'Start Journey'}
              </button>
            )}
            {state.startedAt && !state.completed && (
              <button onClick={markCompleted} className="px-5 py-2.5 rounded-md bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
                Finish Journey
              </button>
            )}
            <button onClick={resetJourney} className="px-5 py-2.5 rounded-md bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors">
              Reset
            </button>
          </div>
        </div>

        {!state.startedAt && (
          <div className="mb-10 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Plan Route (Departure → Midpoints → Arrival)</h2>
            <p className="text-sm text-slate-600 mb-4">1. Search & set Departure and Arrival. 2. Search & add optional Midpoints (they appear on the map immediately). 3. Start journey. OTPs auto-generate inside each geofence.</p>
            <div className="space-y-4">
              {state.waypoints.map(w => {
                const isEndpoint = w.id === 'depart' || w.id === 'arrive';
                return (
                  <div key={w.id} className="p-4 border border-slate-200 rounded-lg flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-slate-900">{w.label}</p>
                      <LocationSearch
                        value={w.target ? { address: w.target.address || w.label, lat: w.target.lat, lng: w.target.lng } : null}
                        placeholder={`Search ${w.label} location`}
                        onSelect={(loc: LocationSelection) => {
                          setState(prev => ({
                            ...prev,
                            waypoints: prev.waypoints.map(wp => wp.id === w.id ? { ...wp, target: { lat: loc.lat, lng: loc.lng, radiusMeters: wp.target?.radiusMeters || 150, address: loc.address } } : wp)
                          }));
                        }}
                        disabled={!!state.startedAt}
                      />
                      {w.target && (
                        <p className="text-[10px] text-slate-500 font-mono">{w.target.lat.toFixed(4)}, {w.target.lng.toFixed(4)}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] uppercase tracking-wide text-slate-500">Radius</label>
                        <input
                          type="number"
                          min={50}
                          max={1000}
                          value={w.target?.radiusMeters || 150}
                          onChange={e => updateRadius(w.id, Number(e.target.value))}
                          disabled={!!state.startedAt}
                          className="w-24 px-2 py-1 text-xs border border-slate-300 rounded"
                        />
                      </div>
                      {!isEndpoint && !state.startedAt && (
                        <button
                          onClick={() => captureTarget(w.id)}
                          className="px-3 py-2 text-xs rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                        >Use Current Pos</button>
                      )}
                    </div>
                    {!isEndpoint && <p className="text-[10px] text-slate-500">Midpoints appear in order added. Add only after departure & arrival set.</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Add Midpoint</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <LocationSearch
                    value={midpointSelection ? { address: midpointSelection.address, lat: midpointSelection.lat, lng: midpointSelection.lng } : null}
                    placeholder="Search midpoint location"
                    onSelect={(loc: LocationSelection) => {
                      setMidpointSelection(loc);
                      if (!midpointLabel.trim()) setMidpointLabel(loc.address.split(',')[0]);
                    }}
                    disabled={!!state.startedAt}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Optional custom label"
                      value={midpointLabel}
                      onChange={e => setMidpointLabel(e.target.value)}
                      disabled={!!state.startedAt}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    />
                    <button
                      onClick={addWaypoint}
                      disabled={!!state.startedAt || !midpointSelection || !state.waypoints.find(w => w.id === 'depart')?.target || !state.waypoints.find(w => w.id === 'arrive')?.target}
                      className="w-full px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-50"
                    >Add Midpoint</button>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Midpoints are inserted between Departure and Arrival in the order added. You can still adjust their radius or retarget before starting.</p>
              </div>
            </div>
          </div>
        )}

        {/* Map Visualization */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" /> Live Map</h2>
          <div className="relative h-96 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <MapView />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Map uses OpenStreetMap tiles. Live marker updates while journey is active.</p>
        </div>

        {/* Waypoints */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {state.waypoints.map((w) => {
            const isActive = activeWaypointId === w.id;
            return (
              <div key={w.id} className="relative p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      {w.verified && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                      {w.label}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {w.timestamp ? new Date(w.timestamp).toLocaleTimeString() : 'Pending'}
                    </p>
                    {w.target && (
                      <p className="text-[10px] mt-1 text-slate-400 font-mono">→ target {w.target.lat.toFixed(4)}, {w.target.lng.toFixed(4)} ±{w.target.radiusMeters}m</p>
                    )}
                  </div>
                  <div className="text-right">
                    {w.coords && (
                      <p className="text-[11px] text-slate-500 font-mono leading-tight">
                        {w.coords.lat.toFixed(4)}, {w.coords.lng.toFixed(4)}
                      </p>
                    )}
                    {w.otp && !w.verified && <span className="inline-block mt-1 text-[10px] uppercase tracking-wide text-emerald-600 font-semibold">OTP Sent</span>}
                  </div>
                </div>

                {!w.verified && state.startedAt && (
                  <div className="space-y-3">
                    {!w.otp && !w.target && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">No target set; cannot auto-generate. (Set in planning.)</p>
                    )}
                    {!w.otp && (
                      <button
                        onClick={() => triggerOtp(w.id)}
                        className="w-full text-sm px-4 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                      >
                        Generate OTP
                      </button>
                    )}

                    {w.otp && isActive && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0,4))}
                          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <button
                          onClick={verifyOtp}
                          className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                          disabled={loading}
                        >
                          Verify
                        </button>
                      </div>
                    )}

                    {w.otp && !isActive && !w.verified && (
                      <button
                        onClick={() => setActiveWaypointId(w.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Enter OTP
                      </button>
                    )}
                  </div>
                )}

                {w.verified && (
                  <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <Shield className="h-4 w-4" /> Verified & Logged
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Journey Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-900">Journey Summary</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-slate-50">
              <p className="text-slate-500 mb-1">Started At</p>
              <p className="font-medium text-slate-900">{state.startedAt ? new Date(state.startedAt).toLocaleString() : '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <p className="text-slate-500 mb-1">Completed</p>
              <p className="font-medium text-slate-900">{state.completed ? 'Yes' : 'No'}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50">
              <p className="text-slate-500 mb-1">Finished At</p>
              <p className="font-medium text-slate-900">{state.endedAt ? new Date(state.endedAt).toLocaleString() : '—'}</p>
            </div>
          </div>

          {state.startCoords && (
            <div className="mt-6">
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Start Coordinates</p>
              <code className="px-2 py-1 rounded bg-slate-100 text-[11px] font-mono">{state.startCoords.lat.toFixed(4)}, {state.startCoords.lng.toFixed(4)}</code>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate('/journey-together')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              Back to Journey Together <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JourneyTracker;