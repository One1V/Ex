import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Filter, Heart, Shield, LocateFixed, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../../api.js';
import { useAuth } from '../context/AuthContext';

const FindMentor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [nearMe, setNearMe] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guides, setGuides] = useState<Array<{
    id: string;
    name: string;
    photoUrl?: string | null;
    exams: string[];
    cities: string[];
    achievements: string[];
    rating?: number;
    reviewCount?: number;
    distanceMeters?: number;
  }>>([]);

  // Build filters options from data
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    guides.forEach(g => g.cities?.forEach(c => c && set.add(c)));
    return ['All Cities', ...Array.from(set).sort()];
  }, [guides]);
  const examOptions = useMemo(() => {
    const set = new Set<string>();
    guides.forEach(g => g.exams?.forEach(e => e && set.add(e)));
    return ['All Exams', ...Array.from(set).sort()];
  }, [guides]);

  // Fetch guides from API whenever filters change
  useEffect(() => {
    let ignore = false;
    async function fetchGuides() {
      if (!user) return;
      setLoading(true); setError(null);
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams();
        if (selectedExam) params.set('exam', selectedExam);
        if (selectedCity) params.set('city', selectedCity);
        if (nearMe && coords) {
          params.set('lat', String(coords.lat));
          params.set('lng', String(coords.lng));
          params.set('radiusKm', '100');
        }
        const q = params.toString();
        const data = await api.get(`/guides${q ? `?${q}` : ''}`, { auth: token });
        if (!ignore) setGuides(data.guides || []);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load guides');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchGuides();
    return () => { ignore = true; };
  }, [user, selectedCity, selectedExam, nearMe, coords]);

  // Handle near-me toggle to get geolocation
  const handleNearMe = () => {
    if (!nearMe) {
      if (!('geolocation' in navigator)) {
        setError('Geolocation is not supported by your browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setNearMe(true);
        },
        () => {
          setError('Unable to retrieve your location');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setNearMe(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Find Your Perfect Guide
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto" style={{ fontFamily: 'Lato, sans-serif' }}>
              Connect with experienced guides who've successfully navigated exams in your city. Get personalized guidance and support.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-emerald-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Filter Guides
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                  City
                </label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {cityOptions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="exam" className="block text-sm font-medium text-slate-700 mb-2">
                  Exam Type
                </label>
                <select
                  id="exam"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {examOptions.map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleNearMe}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${nearMe ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                <LocateFixed className="h-4 w-4" /> {nearMe ? 'Using your location' : 'Use my location'}
              </button>
              {nearMe && coords && (
                <span className="text-xs text-slate-500">Lat {coords.lat.toFixed(3)}, Lng {coords.lng.toFixed(3)}</span>
              )}
            </div>
          </div>

          {/* Mentors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map(mentor => (
              <div key={mentor.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {mentor.photoUrl ? (
                      <img
                        src={mentor.photoUrl}
                        alt={mentor.name}
                        className="w-16 h-16 rounded-full object-cover mr-4"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-4 text-xl font-semibold">
                        {mentor.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {mentor.name}
                        </h3>
                        <Shield className="h-4 w-4 text-emerald-600 ml-2" />
                      </div>
                      {/* Rating display */}
                      {typeof mentor.rating === 'number' && mentor.rating > 0 && (
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-slate-600 ml-1">
                            {mentor.rating.toFixed(1)} ({mentor.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-slate-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {(mentor.cities?.[0] || 'Unknown City')} • {mentor.exams?.join(', ')}
                  {typeof mentor.distanceMeters === 'number' && (
                    <span className="ml-2 text-xs text-slate-500">• {(mentor.distanceMeters / 1000).toFixed(1)} km away</span>
                  )}
                </div>

                {/* Response time placeholder */}

                {mentor.achievements?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.achievements.slice(0, 4).map(tag => (
                      <span key={tag} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Offers/support types can be added later */}

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/book-session/${mentor.id}`)}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-center text-sm"
                  >
                    Book Session
                  </button>
                  <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" title="Save">
                    <Heart className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loading && guides.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg" style={{ fontFamily: 'Lato, sans-serif' }}>
                No Guides found for your selected filters. Try adjusting your search criteria.
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-slate-600">Loading guides…</div>
          )}

          {error && (
            <div className="text-center py-4 text-red-600 text-sm">{error}</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FindMentor;