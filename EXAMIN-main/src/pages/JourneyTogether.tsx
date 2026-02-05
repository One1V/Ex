import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Users, Heart, MapPin, BookOpen, Home } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const journeySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  city: z.string().min(1, 'Please enter your city'),
  examType: z.string().min(1, 'Please select your exam type'),
  examDate: z.string().min(1, 'Please select your exam date'),
  examCenter: z.string().min(1, 'Please enter your exam center'),
  departureLocation: z.string().min(1, 'Please enter your departure location'),
  genderPreference: z.enum(['male', 'female', 'combined'], {
    required_error: 'Please select your travel companion preference'
  }),
  travelPreference: z.array(z.string()).min(1, 'Please select at least one travel preference'),
  accommodationPreference: z.array(z.string()).optional(),
  additionalInfo: z.string().optional()
});

type JourneyFormData = z.infer<typeof journeySchema>;

const JourneyTogether: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<JourneyFormData>({
    resolver: zodResolver(journeySchema)
  });

  const onSubmit = async (_data: JourneyFormData) => {
    void _data;
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Journey Together request submitted! We\'ll find you travel companions for your exam day soon.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      void error;
      toast.error('Something went wrong. Please try again.');
    }
  };

  const examTypes = [
    'JEE Main', 'JEE Advanced', 'NEET', 'CAT', 'GATE', 'UPSC', 'SSC', 'Bank PO', 'Other'
  ];

  const travelPreferences = [
    { id: 'shared-transport', label: 'Shared Transportation', description: 'Share taxi, cab, or private vehicle to exam center' },
    { id: 'public-transport', label: 'Public Transport', description: 'Travel together via bus, train, or metro' },
    { id: 'early-departure', label: 'Early Departure', description: 'Prefer to leave early to avoid rush and reach on time' },
    // { id: 'moral-support', label: 'Moral Support', description: 'Provide emotional support and encouragement during travel' },
    // { id: 'safety-companion', label: 'Safety Companion', description: 'Travel together for safety, especially for early morning exams' },
    { id: 'cost-sharing', label: 'Cost Sharing', description: 'Share travel expenses like taxi fare or fuel costs' }
  ];

  const accommodationPreferences = [
    { id: 'budget', label: 'Budget Hotels (₹500-₹1,500/night)', description: 'Basic accommodation with essential amenities' },
    { id: 'mid-range', label: 'Mid-Range Hotels (₹1,500-₹3,500/night)', description: 'Comfortable stay with good amenities' },
    { id: 'premium', label: 'Premium Hotels (₹3,500-₹7,000/night)', description: 'Luxury accommodation with premium services' },
    { id: 'shared-room', label: 'Shared Room', description: 'Share accommodation costs with fellow travelers' },
    { id: 'near-center', label: 'Near Exam Center', description: 'Prefer accommodation close to the exam venue' },
    { id: 'transport-access', label: 'Good Transport Access', description: 'Easy access to public transportation' }
  ];

  const examDates = [
    'January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026',
    'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Journey Together
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: 'Lato, sans-serif' }}>
              Find travel companions for your exam day! Connect with fellow students traveling to the same exam center for a safe and comfortable journey.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                      City *
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      id="city"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., Delhi, Mumbai, Bangalore"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Exam Information */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
                    <label htmlFor="examDate" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Date *
                    </label>
                    <select
                      {...register('examDate')}
                      id="examDate"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="">Select exam date</option>
                      {examDates.map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                    {errors.examDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.examDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="examCenter" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Center *
                    </label>
                    <input
                      {...register('examCenter')}
                      type="text"
                      id="examCenter"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., ABC College, XYZ Institute"
                    />
                    {errors.examCenter && (
                      <p className="mt-1 text-sm text-red-600">{errors.examCenter.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="departureLocation" className="block text-sm font-medium text-slate-700 mb-2">
                      Departure Location *
                    </label>
                    <input
                      {...register('departureLocation')}
                      type="text"
                      id="departureLocation"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., Railway Station, Bus Stand, Area Name"
                    />
                    {errors.departureLocation && (
                      <p className="mt-1 text-sm text-red-600">{errors.departureLocation.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Partner Preference */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Heart className="h-5 w-5 mr-2 text-emerald-600" />
                  Travel Companion Preference
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Gender Preference for Travel Companion *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        {...register('genderPreference')}
                        type="radio"
                        value="male"
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div>
                        <div className="font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Male Companions Only
                        </div>
                        <div className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          Travel with male companions
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        {...register('genderPreference')}
                        type="radio"
                        value="female"
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div>
                        <div className="font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Female Companions Only
                        </div>
                        <div className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          Travel with female companions
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        {...register('genderPreference')}
                        type="radio"
                        value="combined"
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div>
                        <div className="font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Mixed Groups
                        </div>
                        <div className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          Open to all travel companions
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.genderPreference && (
                    <p className="mt-2 text-sm text-red-600">{errors.genderPreference.message}</p>
                  )}
                </div>
              </div>

              {/* Travel Preferences */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                  Travel Preferences
                </h2>
                
                <div className="space-y-4">
                  {travelPreferences.map(preference => (
                    <label key={preference.id} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        {...register('travelPreference')}
                        type="checkbox"
                        value={preference.id}
                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {preference.label}
                        </div>
                        <div className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {preference.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.travelPreference && (
                  <p className="mt-2 text-sm text-red-600">{errors.travelPreference.message}</p>
                )}
              </div>

              {/* Accommodation Preferences */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Home className="h-5 w-5 mr-2 text-emerald-600" />
                  Accommodation Preferences
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Hotel & Stay Preferences (Optional)
                  </label>
                  <div className="space-y-4">
                    {accommodationPreferences.map(preference => (
                      <label key={preference.id} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          {...register('accommodationPreference')}
                          type="checkbox"
                          value={preference.id}
                          className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div>
                          <div className="font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {preference.label}
                          </div>
                          <div className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                            {preference.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.accommodationPreference && (
                    <p className="mt-2 text-sm text-red-600">{errors.accommodationPreference.message}</p>
                  )}
                </div>
              </div>

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
                  placeholder="Any specific travel requirements, preferred departure times, medical conditions, or other details..."
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Finding Companions...' : 'Find Travel Companions'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JourneyTogether;
