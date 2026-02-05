import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Video, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoSession from '../components/VideoSession';
import JitsiSession from '../components/JitsiSession';
import { useAuth } from '../context/AuthContext';
import api from '../../api.js';
import { buildMeetingUrl, VIDEO_PROVIDER } from '../config/video';

type GuideInfo = {
  name: string;
  email: string;
  photoUrl?: string;
  rating?: number;
  reviewCount?: number;
};

type UserInfo = {
  name: string;
  email: string;
  photoUrl?: string;
  phone?: string;
};

type Session = {
  _id: string;
  guide?: GuideInfo;
  user?: UserInfo;
  preferences: Array<{ type: string; price: number }>;
  totalAmount: number;
  scheduledAt: string;
  duration: number;
  status: 'booked' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus: string;
  roomId?: string;
  rating?: number;
  feedback?: string;
  chatMode?: 'one-way' | 'two-way';
};

const MySessions: React.FC = () => {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'booked' | 'in-progress' | 'completed'>('all');
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeVideoSession, setActiveVideoSession] = useState<{
    roomUrl: string;
    sessionId: string;
    guideName?: string;
    userName?: string;
    chatMode?: 'one-way' | 'two-way';
  } | null>(null);

  const isGuide = role === 'guide';

  useEffect(() => {
    fetchSessions();
  }, [user, isGuide]);

  async function fetchSessions() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const endpoint = isGuide ? '/sessions/guide' : '/sessions/my';
      const data = await api.get(endpoint, { auth: token });
      setSessions(data.sessions || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  async function startSession(sessionId: string) {
    if (activeVideoSession) return; // guard against double-start
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const result = await api.post(`/sessions/${sessionId}/start`, {}, { auth: token });
      
      // Find the session to get participant details
      const session = sessions.find(s => s._id === sessionId);
      
  // Build meeting URL using configured provider (Jitsi by default)
  const roomUrl = buildMeetingUrl(result.roomId);
      
      setActiveVideoSession({
        roomUrl,
        sessionId,
        guideName: session?.guide?.name,
        userName: session?.user?.name,
        chatMode: (session as any)?.chatMode || 'two-way',
      });
      
      toast.success('Session started!');
      fetchSessions();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to start session');
    }
  }

  function joinSession(session: Session) {
    if (activeVideoSession) return; // guard against double-join
    if (!session.roomId) {
      toast.error('Session not started yet');
      return;
    }
    
  const roomUrl = buildMeetingUrl(session.roomId);
    
    setActiveVideoSession({
      roomUrl,
      sessionId: session._id,
      guideName: session.guide?.name,
      userName: session.user?.name,
      chatMode: (session as any)?.chatMode || 'two-way',
    });
  }

  function leaveVideoSession() {
    setActiveVideoSession(null);
    fetchSessions();
  }

  async function endSession(sessionId: string) {
    if (!user) return;
    if (!confirm('Are you sure you want to end this session?')) return;
    try {
      const token = await user.getIdToken();
      await api.post(`/sessions/${sessionId}/end`, {}, { auth: token });
      toast.success('Session ended successfully');
      fetchSessions();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to end session');
    }
  }

  async function submitFeedback(sessionId: string) {
    if (!user) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await api.post('/sessions/feedback', {
        sessionId,
        rating: feedbackRating,
        feedback: feedbackText,
      }, { auth: token });
      toast.success('Feedback submitted! Thank you.');
      setShowFeedback(null);
      setFeedbackRating(5);
      setFeedbackText('');
      fetchSessions();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  async function changeChatMode(sessionId: string, mode: 'one-way' | 'two-way') {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await api.patch(`/sessions/${sessionId}/chat-mode`, { mode }, { auth: token });
      // Update local state for immediate UI feedback
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, chatMode: mode } : s));
      setActiveVideoSession(prev => prev && prev.sessionId === sessionId ? { ...prev, chatMode: mode } : prev);
      toast.success(`Chat mode set to ${mode === 'two-way' ? 'Two-way' : 'One-way'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change chat mode');
    }
  }

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">Loading sessions...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {isGuide ? 'My Guide Sessions' : 'My Sessions'}
              </h1>
              <p className="text-slate-600 mt-2">
                {isGuide ? 'Manage and conduct your mentoring sessions' : 'View and join your booked sessions'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('booked')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'booked' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'in-progress' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border'}`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg transition ${filter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border'}`}
              >
                Completed
              </button>
            </div>
          </div>

          {filteredSessions.length === 0 && (
            <div className="bg-white p-12 rounded-xl shadow text-center">
              <p className="text-slate-600">No sessions found</p>
            </div>
          )}

          <div className="space-y-4">
            {filteredSessions.map(session => {
              const otherPerson = isGuide ? session.user : session.guide;
              const guideInfo = session.guide;
              const userInfo = session.user;
              const canStart = isGuide && session.status === 'booked';
              const canJoin = !isGuide && session.status === 'in-progress' && session.roomId;
              const canEnd = isGuide && session.status === 'in-progress';
              const canRejoin = isGuide && session.status === 'in-progress' && session.roomId;
              const canFeedback = !isGuide && session.status === 'completed' && !session.rating;

              return (
                <div key={session._id} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherPerson?.photoUrl ? (
                        <img src={otherPerson.photoUrl} alt={otherPerson.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-semibold">
                          {otherPerson?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {isGuide ? 'Session with ' : 'Session with Guide '}{otherPerson?.name}
                          </h3>
                          <p className="text-sm text-slate-600">{otherPerson?.email}</p>
                          {isGuide && userInfo?.phone && (
                            <p className="text-sm text-slate-600">Phone: {userInfo.phone}</p>
                          )}
                          {!isGuide && guideInfo && typeof guideInfo.rating === 'number' && guideInfo.rating > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              ★ {guideInfo.rating.toFixed(1)} ({guideInfo.reviewCount || 0} reviews)
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed' ? 'bg-green-100 text-green-700' :
                          session.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'booked' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(session.scheduledAt)} ({session.duration} min)
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-2">Preferences:</p>
                        <div className="flex flex-wrap gap-2">
                          {session.preferences.map((pref, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs">
                              {pref.type} - ₹{pref.price}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        {/* Guide-only: Chat mode toggle */}
                        {isGuide && (
                          <div className="flex items-center gap-2 mr-4">
                            <span className="text-xs text-slate-500">Chat:</span>
                            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                              <button
                                onClick={() => changeChatMode(session._id, 'two-way')}
                                disabled={session.chatMode === 'two-way'}
                                className={`px-2 py-1 text-xs ${session.chatMode === 'two-way' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                title="Allow both guide and student to chat"
                              >
                                Two-way
                              </button>
                              <button
                                onClick={() => changeChatMode(session._id, 'one-way')}
                                disabled={session.chatMode === 'one-way'}
                                className={`px-2 py-1 text-xs border-l border-slate-200 ${session.chatMode === 'one-way' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                title="Only guide can send messages"
                              >
                                One-way
                              </button>
                            </div>
                          </div>
                        )}
                        {canStart && (
                          <button
                            onClick={() => startSession(session._id)}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                          >
                            <Video className="h-4 w-4" />
                            Start Session
                          </button>
                        )}
                        {canJoin && (
                          <button
                            onClick={() => joinSession(session)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                          >
                            <Video className="h-4 w-4" />
                            Join Session
                          </button>
                        )}
                        {canEnd && (
                          <button
                            onClick={() => endSession(session._id)}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            End Session
                          </button>
                        )}
                        {canRejoin && (
                          <button
                            onClick={() => joinSession(session)}
                            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition"
                          >
                            <Video className="h-4 w-4" />
                            Rejoin
                          </button>
                        )}
                        {canFeedback && (
                          <button
                            onClick={() => setShowFeedback(session._id)}
                            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
                          >
                            <Star className="h-4 w-4" />
                            Give Feedback
                          </button>
                        )}
                        {session.status === 'completed' && session.rating && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>Rated {session.rating}/5</span>
                          </div>
                        )}
                      </div>

                      {session.status === 'completed' && !isGuide && !session.rating && (
                        <p className="mt-3 text-xs text-slate-500 italic">Session completed. Please provide feedback to help improve the guide's profile!</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Rate Your Session</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="text-3xl focus:outline-none"
                  >
                    <Star className={`h-8 w-8 ${star <= feedbackRating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Feedback (Optional)</label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => submitFeedback(showFeedback)}
                disabled={submitting}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                onClick={() => {
                  setShowFeedback(null);
                  setFeedbackRating(5);
                  setFeedbackText('');
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Session */}
      {activeVideoSession && (
        VIDEO_PROVIDER === 'daily' ? (
          <VideoSession
            roomUrl={activeVideoSession.roomUrl}
            isGuide={isGuide}
            onLeave={leaveVideoSession}
            sessionId={activeVideoSession.sessionId}
            guideName={activeVideoSession.guideName}
            userName={activeVideoSession.userName}
            chatMode={activeVideoSession.chatMode}
          />
        ) : (
          <JitsiSession
            roomUrl={activeVideoSession.roomUrl}
            onLeave={leaveVideoSession}
            guideName={activeVideoSession.guideName}
            userName={activeVideoSession.userName}
            sessionId={activeVideoSession.sessionId}
            chatMode={activeVideoSession.chatMode}
            isGuide={isGuide}
          />
        )
      )}

      <Footer />
    </div>
  );
};

export default MySessions;
