import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LocationSearch from '../components/LocationSearch';
import type { LocationSelection } from '../components/LocationSearch';
import { useAuth } from '../context/AuthContext';
import api from '../../api.js';

type Attempt = {
  year: number | '';
  city: string;
  address: string;
  achievement: string;
  sel: LocationSelection | null;
};
type ExamForm = {
  examName: string;
  times: number;
  attempts: Attempt[];
};

const GuideProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [exams, setExams] = useState<ExamForm[]>([
    { examName: '', times: 1, attempts: [{ year: '', city: '', address: '', achievement: '', sel: null }] }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize from profile if data exists
    const gAll = (profile as any)?.guideExams;
    setViewProfile(profile as any);
    if ((profile as any)?.photoUrl) {
      setPhotoUrl((profile as any).photoUrl);
    }
    if (Array.isArray(gAll) && gAll.length > 0) {
      const mapped: ExamForm[] = gAll.map((g: any) => {
        const total = Math.max(1, Number(g.totalAttempts || (g.attempts?.length || 1)));
        const atts: Attempt[] = (g.attempts || []).map((a: any) => ({
          year: typeof a.year === 'number' ? a.year : '',
          city: a.city || '',
          address: a.address || '',
          achievement: a.achievement || '',
          sel: a.coords?.coordinates ? { lat: a.coords.coordinates[1], lng: a.coords.coordinates[0], address: a.city || a.address || '' } : null,
        }));
        if (atts.length === 0) atts.push({ year: '', city: '', address: '', achievement: '', sel: null });
        // normalize to match total attempts
        while (atts.length < total) atts.push({ year: '', city: '', address: '', achievement: '', sel: null });
        if (atts.length > total) atts.length = total;
        return { examName: g.examName || '', times: total, attempts: atts };
      });
      setExams(mapped);
    }
  }, [profile]);

  function syncAttemptsLength(examIdx: number, nextTimes: number) {
    setExams(prev => prev.map((ex, i) => {
      if (i !== examIdx) return ex;
      const copy = [...ex.attempts];
      if (nextTimes > copy.length) {
        const extra: Attempt[] = Array.from({ length: nextTimes - copy.length }).map(() => ({
          year: '' as const,
          city: '',
          address: '',
          achievement: '',
          sel: null,
        }));
        return { ...ex, times: nextTimes, attempts: [...copy, ...extra] };
      } else if (nextTimes < copy.length) {
        return { ...ex, times: nextTimes, attempts: copy.slice(0, nextTimes) };
      }
      return { ...ex, times: nextTimes };
    }));
  }

  const canSave = useMemo(() => {
    if (!user) return false;
    if (!exams.length) return false;
    return exams.every(ex => ex.examName.trim() && ex.times >= 1 && ex.attempts.length === ex.times && ex.attempts.every(a => !!a.sel));
  }, [user, exams]);

  async function save() {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        photoUrl: photoUrl || undefined,
        guideExams: exams.map(ex => ({
          examName: ex.examName.trim(),
          totalAttempts: ex.times,
          attempts: ex.attempts.map(a => ({
            year: typeof a.year === 'number' ? a.year : undefined,
            city: a.sel?.address || a.city,
            address: a.address.trim(),
            achievement: a.achievement.trim(),
            coords: a.sel ? { type: 'Point', coordinates: [a.sel.lng, a.sel.lat] } : undefined,
          })),
        }))
      };
      await api.post('/users', payload, { auth: token });
      // Refresh current details and exit edit mode
      try {
        const fresh = await api.get('/me', { auth: token });
        setViewProfile(fresh.user);
        setPhotoUrl(fresh.user?.photoUrl || photoUrl);
      } catch {}
      setEditMode(false);
      alert('Guide profile saved');
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">Guide</h1>
          {!editMode ? (
            <button onClick={() => setEditMode(true)} className="px-4 py-2 rounded bg-[#05976a] text-white">Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded border border-slate-300 text-slate-700">Cancel</button>
              <button disabled={!canSave || saving} onClick={save} className="px-4 py-2 rounded bg-[#05976a] text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </div>

        {!editMode && (
          <div className="space-y-6">
            {/* Current profile with avatar */}
            <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center">
              <div className="relative">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
                ) : (
                  <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-semibold" style={{ backgroundColor: '#05976a' }}>
                    {(viewProfile?.name || viewProfile?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#05976a' }}>
                  <Camera className="w-4 h-4" />
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-3">Your profile</p>
            </div>

            {/* Details */}
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="mb-4">
                <div className="text-sm text-slate-500">Name</div>
                <div className="font-medium">{viewProfile?.name || '-'}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-slate-500">Email</div>
                <div className="font-medium">{viewProfile?.email || '-'}</div>
              </div>
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-800">Past Exams</div>
                {(viewProfile?.guideExams || []).length === 0 && (
                  <div className="text-sm text-slate-500">No exams added yet.</div>
                )}
                {(viewProfile?.guideExams || []).map((ex: any, i: number) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="font-medium">{ex.examName || 'Exam'}</div>
                    <div className="font-medium">{ex.examName || 'Exam'}</div>
                    <div className="text-xs text-slate-500 mb-2">Attempts: {ex.totalAttempts || ex.attempts?.length || 0}</div>
                    <ul className="space-y-2">
                      {(ex.attempts || []).map((a: any, j: number) => (
                        <li key={j} className="text-sm">
                          <div className="font-medium">Attempt #{j+1}</div>
                          {typeof a.year === 'number' && <div className="text-slate-600">Year: {a.year}</div>}
                          <div className="text-slate-600">City: {a.city || '-'}</div>
                          {a.address && <div className="text-slate-600">Address: {a.address}</div>}
                          {a.achievement && <div className="text-slate-600">Achievement: {a.achievement}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {editMode && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative"
                  aria-label="Change profile picture"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
                  ) : (
                    <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-semibold" style={{ backgroundColor: '#05976a' }}>
                      {(viewProfile?.name || viewProfile?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow" style={{ backgroundColor: '#05976a' }}>
                    <Camera className="w-4 h-4" />
                  </span>
                </button>
                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">Click to change profile picture</div>
                  <p className="text-xs text-slate-500">JPG/PNG up to 5MB.</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    try {
                      const token = await user.getIdToken();
                      const uploaded = await api.upload('/upload', file, { auth: token, folder: 'examin/profile' });
                      setPhotoUrl(uploaded.url);
                    } catch (err: any) {
                      alert(err.message || 'Upload failed');
                    } finally {
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {editMode && exams.map((exam, eIdx) => (
            <div key={eIdx} className="space-y-6 bg-white p-6 rounded-xl shadow">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">Exam #{eIdx + 1}</div>
                {exams.length > 1 && (
                  <button
                    type="button"
                    className="text-sm text-rose-600 hover:underline"
                    onClick={() => setExams(prev => prev.filter((_, i) => i !== eIdx))}
                  >
                    Remove exam
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Name</label>
                <input
                  value={exam.examName}
                  onChange={e=> setExams(prev => prev.map((x,i)=> i===eIdx? { ...x, examName: e.target.value }: x))}
                  placeholder="e.g., JEE Main, NEET, SSC CGL"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of times you attempted</label>
                <input
                  type="number"
                  min={1}
                  value={exam.times}
                  onChange={e => syncAttemptsLength(eIdx, Math.max(1, Number(e.target.value||1)))}
                  className="w-32 border px-3 py-2 rounded"
                />
              </div>

              {exam.attempts.map((a, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="text-sm font-semibold text-slate-700">Attempt #{idx+1}</div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Exam City</label>
                    <LocationSearch
                      value={a.sel}
                      onSelect={sel => setExams(prev => prev.map((ex,i)=> i===eIdx? { ...ex, attempts: ex.attempts.map((x,j)=> j===idx? { ...x, sel, city: sel.address }: x) }: ex))}
                      placeholder="Search city (Photon + OSM)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Year</label>
                    <select
                      value={a.year}
                      onChange={e=> setExams(prev => prev.map((ex,i)=> i===eIdx? { ...ex, attempts: ex.attempts.map((x,j)=> j===idx? { ...x, year: e.target.value ? Number(e.target.value) : '' }: x) }: ex))}
                      className="w-40 border px-3 py-2 rounded"
                    >
                      <option value="">Select year</option>
                      {Array.from({ length: 21 }).map((_, k) => {
                        const y = new Date().getFullYear() - k;
                        return <option key={y} value={y}>{y}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Complete Address</label>
                    <input
                      value={a.address}
                      onChange={e=> setExams(prev => prev.map((ex,i)=> i===eIdx? { ...ex, attempts: ex.attempts.map((x,j)=> j===idx? { ...x, address: e.target.value }: x) }: ex))}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Full exam center address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Achievement</label>
                    <input
                      value={a.achievement}
                      onChange={e=> setExams(prev => prev.map((ex,i)=> i===eIdx? { ...ex, attempts: ex.attempts.map((x,j)=> j===idx? { ...x, achievement: e.target.value }: x) }: ex))}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="e.g., AIR 1200, 98 percentile"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}

        {editMode && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-emerald-700 hover:underline"
              onClick={() => setExams(prev => ([...prev, { examName: '', times: 1, attempts: [{ year: '', city: '', address: '', achievement: '', sel: null }] }]))}
            >
              + Add another exam
            </button>
            <button disabled={!canSave || saving} onClick={save} className="bg-[#05976a] text-white px-6 py-2 rounded disabled:opacity-50">
              {saving ? 'Saving…' : 'Save' }
            </button>
          </div>
        )}
        {!editMode && (
          <div className="mt-6 text-center text-sm text-slate-500">Click Edit to update your details.</div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GuideProfile;
