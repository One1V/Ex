import React, { useEffect, useRef, useState } from 'react';

// Free geocoding / search (no key): prioritise Photon (covers IN well) then fallback to Nominatim.
// NOTE: Respect usage policies: minimal query frequency & include a custom User-Agent if self-hosting.

interface OSMResult { display_name: string; lat: string; lon: string; }
interface PhotonFeature { properties: { name?: string; country?: string; state?: string; city?: string; postcode?: string; osm_value?: string; }; geometry: { coordinates: [number, number]; }; }

async function queryPhoton(q: string): Promise<LocationSelection[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('Photon request failed');
  const data = await r.json();
  const features: PhotonFeature[] = data.features || [];
  return features.map(f => {
    const addrParts = [f.properties.name, f.properties.city, f.properties.state, f.properties.country].filter(Boolean);
    return { address: addrParts.join(', '), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
  });
}

async function queryNominatim(q: string): Promise<LocationSelection[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('Nominatim request failed');
  const data: OSMResult[] = await r.json();
  return data.map(item => ({ address: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }));
}

async function geocode(q: string): Promise<LocationSelection[]> {
  if (!q.trim()) return [];
  try {
    const photon = await queryPhoton(q);
    if (photon.length) return photon;
  } catch {/* ignore & fall back */}
  try {
    return await queryNominatim(q);
  } catch {
    return [];
  }
}

export interface LocationSelection {
  address: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  value?: LocationSelection | null;
  placeholder?: string;
  onSelect: (loc: LocationSelection) => void;
  disabled?: boolean;
  className?: string;
  minimal?: boolean; // if true just an inline small input
}

const LocationSearch: React.FC<LocationSearchProps> = ({ value, placeholder, onSelect, disabled, className = '', minimal }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [internalValue, setInternalValue] = useState(value?.address || '');
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<LocationSelection[]>([]);
  const [open, setOpen] = useState(false);
  const lastSelectedRef = useRef<string>('');
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setInternalValue(value?.address || ''); }, [value?.address]);

  // Debounced search against free services
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!internalValue || internalValue === lastSelectedRef.current) {
      setResults([]);
      setSearching(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true); setError(null); setOpen(true);
      try {
        const data = await geocode(internalValue);
        setResults(data);
      } catch (e:any) {
        if (e.name !== 'AbortError') setError(e.message || 'Search failed');
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [internalValue]);

  function handlePick(r: LocationSelection) {
    lastSelectedRef.current = r.address;
    setInternalValue(r.address);
    setResults([]);
    setOpen(false);
    setError(null);
    onSelect(r);
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={e => { setInternalValue(e.target.value); setError(null); }}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={placeholder || 'Search location'}
          disabled={disabled}
          autoComplete="off"
          className={`w-full pr-24 px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white disabled:opacity-50 ${minimal ? 'h-8 text-xs' : ''}`}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
          {searching && <span className="flex items-center gap-1 text-[10px] text-emerald-600">Searching<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /></span>}
          {!searching && internalValue && internalValue === lastSelectedRef.current && <span className="text-[10px] text-emerald-600">Set</span>}
        </div>
        {open && results.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg text-sm">
            {results.map(r => (
              <li key={`${r.lat}-${r.lng}`}>
                <button
                  type="button"
                  onClick={() => handlePick(r)}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                >{r.address}</button>
              </li>
            ))}
            {!searching && results.length === 0 && (
              <li className="px-3 py-2 text-[11px] text-slate-500">No results</li>
            )}
          </ul>
        )}
      </div>
      {error && (<span className="mt-1 text-[10px] text-rose-600">{error}</span>)}
      {value?.lat && (
        <code className="mt-1 text-[10px] text-slate-500 font-mono">{value.lat.toFixed(4)}, {value.lng.toFixed(4)}</code>
      )}
    </div>
  );
};

export default LocationSearch;
