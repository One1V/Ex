import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import api from '../../api.js';

type Preference = {
  type: string;
  price: number;
};

type Guide = {
  id: string;
  name: string;
  photoUrl?: string | null;
  exams: string[];
  cities: string[];
  rating?: number;
  reviewCount?: number;
};

const BookSession: React.FC = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState<number>(60);

  const availablePreferences: Preference[] = [
    { type: 'Travel Guidance', price: 50},
    { type: 'Travel & Stay guidance', price: 100 },
    { type: 'Travel + Stay + Exam Strategy', price: 150 },
  ];

  const durationOptions = [30, 60, 90, 120];

  useEffect(() => {
    async function fetchGuide() {
      if (!user || !guideId) return;
      try {
        const token = await user.getIdToken();
        const data = await api.get(`/guides?`, { auth: token });
        const foundGuide = (data.guides || []).find((g: Guide) => g.id === guideId);
        if (foundGuide) setGuide(foundGuide);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load guide');
      } finally {
        setLoading(false);
      }
    }
    fetchGuide();
  }, [user, guideId]);

  const togglePreference = (type: string) => {
    setSelectedPreferences(prev =>
      prev.includes(type) ? prev.filter(p => p !== type) : [...prev, type]
    );
  };

  const calculateTotal = () => {
    return selectedPreferences.reduce((sum, type) => {
      const pref = availablePreferences.find(p => p.type === type);
      return sum + (pref?.price || 0);
    }, 0);
  };

  const handleProceedToPayment = async () => {
    if (!user || !guide) return;
    
    if (selectedPreferences.length === 0) {
      toast.error('Please select at least one preference');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    setProcessing(true);
    try {
      const token = await user.getIdToken();
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      const preferences = selectedPreferences.map(type => {
        const pref = availablePreferences.find(p => p.type === type);
        return { type, price: pref?.price || 0 };
      });

      // Step 1: Create session
      const result = await api.post('/sessions', {
        guideId: guide.id,
        preferences,
        scheduledAt: scheduledAt.toISOString(),
        duration,
      }, { auth: token });

      const sessionId = result.session._id;

      // Step 2: Create Razorpay order
      const orderResult = await api.post('/payments/create-order', {
        sessionId,
      }, { auth: token });

      // Step 3: Open Razorpay payment dialog
      const options = {
        key: orderResult.keyId,
        amount: orderResult.amount * 100, // Amount in paise
        currency: orderResult.currency,
        name: 'EXAMIN',
        description: `Session with ${guide.name}`,
        order_id: orderResult.orderId,
        handler: async function (response: any) {
          try {
            // Step 4: Verify payment
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              sessionId,
            }, { auth: token });

            toast.success('Payment successful! Session booked.');
            navigate('/my-sessions');
          } catch (verifyError: any) {
            toast.error(verifyError?.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#10b981', // emerald-600
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      // Load Razorpay script if not loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        script.onerror = () => {
          toast.error('Failed to load payment gateway');
          setProcessing(false);
        };
        document.body.appendChild(script);
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (e: any) {
      toast.error(e?.message || 'Booking failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">Guide not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const total = calculateTotal();
  const adminFee = Math.round(total * 0.05 * 100) / 100;
  const guideAmount = total - adminFee;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/find-mentor')}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to guides
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-8">Book Your Session</h1>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Guide Information</h2>
                <div className="flex items-center gap-4">
                  {guide.photoUrl ? (
                    <img src={guide.photoUrl} alt={guide.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-semibold">
                      {guide.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{guide.name}</p>
                    <p className="text-sm text-slate-600">{guide.exams?.join(', ')}</p>
                    {typeof guide.rating === 'number' && guide.rating > 0 && (
                      <p className="text-xs text-slate-500">★ {guide.rating.toFixed(1)} ({guide.reviewCount || 0} reviews)</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4">Select Preferences</h2>
                <p className="text-sm text-slate-600 mb-4">You can select multiple options</p>
                <div className="space-y-3">
                  {availablePreferences.map(pref => (
                    <label
                      key={pref.type}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedPreferences.includes(pref.type)
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPreferences.includes(pref.type)}
                          onChange={() => togglePreference(pref.type)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span className="font-medium text-slate-900">{pref.type}</span>
                      </div>
                      <span className="text-emerald-700 font-semibold">₹{pref.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-4"> Session Prefernces</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" /> Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" /> Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map(dur => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDuration(dur)}
                        className={`px-4 py-2 rounded-lg border-2 transition ${
                          duration === dur
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {dur} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
                <div className="space-y-3 mb-4 pb-4 border-b">
                  {selectedPreferences.map(type => {
                    const pref = availablePreferences.find(p => p.type === type);
                    return (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-slate-600">{type}</span>
                        <span className="font-medium">₹{pref?.price}</span>
                      </div>
                    );
                  })}
                  {selectedPreferences.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No preferences selected</p>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-emerald-600">₹{total}</span>
                  </div>
                  <p className="text-xs text-slate-500">Platform fee (5%): ₹{adminFee.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Guide receives: ₹{guideAmount.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={processing || selectedPreferences.length === 0 || !scheduledDate || !scheduledTime}
                  className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {processing ? 'Processing...' : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Proceed to Payment
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-slate-500 mt-3">
                  Secure payment powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookSession;
