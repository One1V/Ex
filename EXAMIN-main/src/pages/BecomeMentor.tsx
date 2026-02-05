import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, BookOpen, Users, Shield, Upload, FileText, Plus, Minus, User } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const examExperienceSchema = z.object({
  examType: z.string().min(1, 'Please select your exam type'),
  examYear: z.string().min(1, 'Please select the year you took the exam'),
  experience: z.string().min(1, 'Please describe your experience')
});

const mentorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  city: z.string().min(1, 'Please enter your city'),
  examExperiences: z.array(examExperienceSchema).min(1, 'Please add at least one exam experience'),
  supportType: z.array(z.string()).min(1, 'Please select at least one support type'),
  availability: z.string().min(1, 'Please describe your availability'),
  additionalInfo: z.string().optional(),
  idProof: z.instanceof(FileList).refine(files => files.length > 0, 'Please upload your ID proof'),
  qualificationCertificate: z.instanceof(FileList).refine(files => files.length > 0, 'Please upload your qualification certificate'),
  admitCard: z.instanceof(FileList).refine(files => files.length > 0, 'Please upload your exam admit card')
});

type MentorFormData = z.infer<typeof mentorSchema>;

const BecomeMentor: React.FC = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<MentorFormData>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      examExperiences: [{ examType: '', examYear: '', experience: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'examExperiences'
  });

  // Uploaded URLs for documents
  const [idProofUrl, setIdProofUrl] = useState<string | null>(null);
  const [qualificationCertificateUrl, setQualificationCertificateUrl] = useState<string | null>(null);
  const [admitCardUrl, setAdmitCardUrl] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, folder: string, onDone: (url: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Please sign in first');
      const token = await currentUser.getIdToken();
      const res = await api.upload('/upload', file, { auth: token, folder });
      onDone(res.url);
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
  }

  const onSubmit = async (_data: MentorFormData) => {
    void _data;
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Guide registration successful! We\'ll review your application and get back to you soon.');
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

  const supportTypes = [
    { id: 'travel', label: 'Travel Guidance', description: 'Help with routes, local tips' },
    { id: 'examday', label: 'Travel & Stay guidance', description: 'Help with routes, accomodation and local tips in one place!' },
    { id: 'strategy', label: 'Travel+ Stay+ Exam-Strategy', description: 'Mindset, confidence building, study tipsroutes, accomodation and local tips everything at your fingertips!' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Become a Guide
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto" style={{ fontFamily: 'Lato, sans-serif' }}>
              Share your exam success story and help students navigate their own journeys. Join our community of supportive guides.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <User className="h-5 w-5 mr-2 text-emerald-600" />
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    <BookOpen className="h-5 w-5 mr-2 text-emerald-600" />
                    Your Exam Experience
                  </h2>
                  <button
                    type="button"
                    onClick={() => append({ examType: '', examYear: '', experience: '' })}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exam
                  </button>
                </div>
                
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Exam Experience {index + 1}
                        </h3>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor={`examExperiences.${index}.examType`} className="block text-sm font-medium text-slate-700 mb-2">
                            Exam Type *
                          </label>
                          <select
                            {...register(`examExperiences.${index}.examType` as const)}
                            id={`examExperiences.${index}.examType`}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          >
                            <option value="">Select your exam</option>
                            {examTypes.map(exam => (
                              <option key={exam} value={exam}>{exam}</option>
                            ))}
                          </select>
                          {errors.examExperiences?.[index]?.examType && (
                            <p className="mt-1 text-sm text-red-600">{errors.examExperiences[index]?.examType?.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor={`examExperiences.${index}.examYear`} className="block text-sm font-medium text-slate-700 mb-2">
                            Year You Took the Exam *
                          </label>
                          <select
                            {...register(`examExperiences.${index}.examYear` as const)}
                            id={`examExperiences.${index}.examYear`}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          >
                            <option value="">Select year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          {errors.examExperiences?.[index]?.examYear && (
                            <p className="mt-1 text-sm text-red-600">{errors.examExperiences[index]?.examYear?.message}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <label htmlFor={`examExperiences.${index}.experience`} className="block text-sm font-medium text-slate-700 mb-2">
                          Your Experience with this Exam *
                        </label>
                        <textarea
                          {...register(`examExperiences.${index}.experience` as const)}
                          id={`examExperiences.${index}.experience`}
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          placeholder="Tell us about your experience with this exam, challenges you faced, and how you overcame them..."
                        />
                        {errors.examExperiences?.[index]?.experience && (
                          <p className="mt-1 text-sm text-red-600">{errors.examExperiences[index]?.experience?.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {errors.examExperiences && (
                    <p className="text-sm text-red-600">{errors.examExperiences.message}</p>
                  )}
                </div>
              </div>

              {/* Support Type */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Users className="h-5 w-5 mr-2 text-emerald-600" />
                  How Can You Help?
                </h2>
                
                <div className="space-y-4">
                  {supportTypes.map(support => (
                    <label key={support.id} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        {...register('supportType')}
                        type="checkbox"
                        value={support.id}
                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {support.label}
                        </div>
                        <div className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                          {support.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.supportType && (
                  <p className="mt-2 text-sm text-red-600">{errors.supportType.message}</p>
                )}
              </div>

              {/* Availability */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <Shield className="h-5 w-5 mr-2 text-emerald-600" />
                  Your Availability
                </h2>
                
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-slate-700 mb-2">
                    When are you available to guide? *
                  </label>
                  <textarea
                    {...register('availability')}
                    id="availability"
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="When are you available to guide? (e.g., weekends, evenings, exam seasons only...)"
                  />
                  {errors.availability && (
                    <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>
                  )}
                </div>
              </div>

              {/* Document Uploads */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                  Required Documents
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="idProof" className="block text-sm font-medium text-slate-700 mb-2">
                      ID Proof *
                    </label>
                    <div className="relative">
                      <input
                        {...register('idProof')}
                        type="file"
                        id="idProof"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleUpload(e, 'examin/mentor/id-proof', (url) => setIdProofUrl(url))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Upload className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                    {idProofUrl && <p className="mt-1 text-xs text-emerald-600">Uploaded ✓</p>}
                    {errors.idProof && (
                      <p className="mt-1 text-sm text-red-600">{errors.idProof.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="qualificationCertificate" className="block text-sm font-medium text-slate-700 mb-2">
                      Qualification Certificate *
                    </label>
                    <div className="relative">
                      <input
                        {...register('qualificationCertificate')}
                        type="file"
                        id="qualificationCertificate"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleUpload(e, 'examin/mentor/qualification', (url) => setQualificationCertificateUrl(url))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Upload className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                    {qualificationCertificateUrl && <p className="mt-1 text-xs text-emerald-600">Uploaded ✓</p>}
                    {errors.qualificationCertificate && (
                      <p className="mt-1 text-sm text-red-600">{errors.qualificationCertificate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="admitCard" className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Admit Card *
                    </label>
                    <div className="relative">
                      <input
                        {...register('admitCard')}
                        type="file"
                        id="admitCard"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleUpload(e, 'examin/mentor/admit-cards', (url) => setAdmitCardUrl(url))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Upload className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                                        <p className="mt-1 text-xs text-slate-500">*Submit all exam admit cards in one pdf</p>
                    <p className="mt-1 text-xs text-slate-500">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                    {admitCardUrl && <p className="mt-1 text-xs text-emerald-600">Uploaded ✓</p>}
                    {errors.admitCard && (
                      <p className="mt-1 text-sm text-red-600">{errors.admitCard.message}</p>
                    )}
                  </div>
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
                  placeholder="Any special skills, languages you speak, or other ways you can support students..."
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Become a Guide'}
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

export default BecomeMentor;