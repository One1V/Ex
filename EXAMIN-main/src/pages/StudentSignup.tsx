// Top-level font injector: runs on module import to minimize FOUT and enforce SK Modernist globally.
(function initSKModernist() {
	// ...safe-guard for non-browser environments...
	if (typeof document === 'undefined') return;
	try {
		const fontHref = 'https://fonts.cdnfonts.com/css/sk-modernist';
		// preconnect (once)
		if (!document.getElementById('sk-modernist-preconnect')) {
			const pre = document.createElement('link');
			pre.id = 'sk-modernist-preconnect';
			pre.rel = 'preconnect';
			pre.href = 'https://fonts.cdnfonts.com';
			pre.crossOrigin = '';
			document.head.appendChild(pre);
		}
		// inline style with @import + global !important rule (once)
		if (!document.getElementById('sk-modernist-global-style')) {
			const style = document.createElement('style');
			style.id = 'sk-modernist-global-style';
			style.innerHTML = `
				@import url('${fontHref}');
				/* Force SK Modernist across the app; !important ensures it overrides inline/component fonts */
				html, body, * { font-family: 'SK Modernist', sans-serif !important; }
			`;
			document.head.appendChild(style);
		}
		// add stylesheet link as a fallback so the font file is fetched by all browsers (once)
		if (!document.getElementById('sk-modernist-link')) {
			const link = document.createElement('link');
			link.id = 'sk-modernist-link';
			link.rel = 'stylesheet';
			link.href = fontHref;
			document.head.appendChild(link);
		}
	} catch {
		/* noop: silently ignore in non-browser or if injection fails */
	}
})();

import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LocationSearch, { type LocationSelection } from '../components/LocationSearch';

const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+=-]{8,}$/,'Must include letter & number'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
  examType: z.string().min(1, 'Please select your exam type'),
  examCity: z.string().min(1, 'Please enter your exam city'),
  examDate: z.string().min(1, 'Please select your exam date'),
  examCenterAddress: z.string().min(1, 'Please enter your exam center address'),
  additionalInfo: z.string().optional()
}).refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type StudentFormData = z.infer<typeof studentSchema>;

const StudentSignup: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {}
  });

  // Selected city (from free Photon/Nominatim search)
  const [examCityLoc, setExamCityLoc] = useState<LocationSelection | null>(null);

  // Compute today's date string (YYYY-MM-DD) to limit past selections
  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  // Admit card upload to backend->Cloudinary (optional)
  const [admitCardUrl, setAdmitCardUrl] = useState<string | null>(null);
  async function onAdmitFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setAdmitCardUrl(null); return; }
    try {
      // Need a token for authenticated upload route
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Please sign in first');
      const token = await currentUser.getIdToken();
      const res = await api.upload('/upload', file, { auth: token, folder: 'examin/admit-cards' });
      setAdmitCardUrl(res.url);
      toast.success('Admit card uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
  }

  const onSubmit = async (_data: StudentFormData) => {
    try {
      // Firebase account creation
      const cred = await createUserWithEmailAndPassword(auth, _data.email, _data.password);
      const idToken = await cred.user.getIdToken();
      // Remove password fields before sending profile
      const { password, confirmPassword, ...profile } = _data;
  const body = { ...profile } as any;
  if (admitCardUrl) body.admitCardUrl = admitCardUrl;
      await api.post('/users', body, { auth: idToken });
      toast.success('Registration successful! Redirecting...');
      navigate('/find-mentor');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Something went wrong. Please try again.');
    }
  };

  const examTypes = [
    'JEE Main', 'JEE Advanced', 'NEET', 'CAT', 'GATE', 'UPSC', 'SSC', 'Bank PO', 'Other'
  ];
  // No support-type selection anymore; we removed travel-related sections

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Find Your Perfect Guide
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tell us about your exam and what support you need. We'll connect you with experienced guide in your city.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-emerald-600" />
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      id="name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                    <input
                      {...register('password')}
                      type="password"
                      id="password"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Min 8 chars, letters & numbers"
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">Confirm Password *</label>
                    <input
                      {...register('confirmPassword')}
                      type="password"
                      id="confirmPassword"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Re-enter password"
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              </div>

              {/* Exam Information */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-emerald-600" />
                  Exam Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="examType" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Type *
                    </label>
                    <select
                      {...register('examType')}
                      id="examType"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Select your exam</option>
                      {examTypes.map(exam => (
                        <option key={exam} value={exam}>{exam}</option>
                      ))}
                    </select>
                    {errors.examType && (
                      <p className="mt-1 text-sm text-red-600">{errors.examType.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="examCity" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam City *
                    </label>
                    {/* Hidden input to bind to RHF while using custom LocationSearch */}
                    <input {...register('examCity')} id="examCity" type="hidden" />
                    <LocationSearch
                      value={examCityLoc}
                      placeholder="Type a city name (free: Photon/Nominatim)"
                      onSelect={(loc) => {
                        setExamCityLoc(loc);
                        setValue('examCity', loc.address, { shouldValidate: true, shouldDirty: true });
                      }}
                      className=""
                    />
                    {examCityLoc && (
                      <p className="mt-1 text-xs text-slate-500">Selected: {examCityLoc.address}</p>
                    )}
                    {errors.examCity && (
                      <p className="mt-1 text-sm text-red-600">{errors.examCity.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="examDate" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Date *
                    </label>
                    <input
                      {...register('examDate')}
                      type="date"
                      id="examDate"
                      min={todayStr}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    {errors.examDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.examDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="examCenterAddress" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Center Address *
                    </label>
                    <input
                      {...register('examCenterAddress')}
                      type="text"
                      id="examCenterAddress"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., ABC College, 123 Main Street, Sector 15"
                    />
                    {errors.examCenterAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.examCenterAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Admit Card Upload (Optional) */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Admit Card (Optional)</h2>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={onAdmitFile}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {admitCardUrl && (
                  <p className="mt-2 text-xs text-slate-500">File attached ✓</p>
                )}
              </div>

              {/* Travel-related fields removed as requested */}

              {/* Additional Information */}
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Information (Optional)
                </label>
                <textarea
                  {...register('additionalInfo')}
                  id="additionalInfo"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Any specific concerns, requirements, or questions you'd like to share with potential Guide..."
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
              <p className="text-center text-sm text-slate-600">Already have an account? <a href="#/signin" className="text-emerald-600 hover:underline">Sign in</a> · <a href="#/forgot-password" className="text-emerald-600 hover:underline">Forgot password?</a></p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentSignup;
