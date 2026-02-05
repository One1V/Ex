import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate, Link } from 'react-router-dom';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

type FormData = z.infer<typeof schema>;

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      await cred.user.getIdToken();
      toast.success('Signed in');
      navigate('/');
    } catch (e: any) {
      toast.error(e?.message || 'Sign in failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-md mx-auto bg-white shadow-sm rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-6">Sign in</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input {...register('email')} type="email" className="w-full px-4 py-3 border rounded-lg" />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input {...register('password')} type="password" className="w-full px-4 py-3 border rounded-lg" />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white px-6 py-3 rounded-lg w-full">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div className="text-sm text-slate-600 mt-4 flex justify-between">
            <Link to="/student-signup" className="text-emerald-600">Create account</Link>
            <Link to="/forgot-password" className="text-emerald-600">Forgot password?</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignIn;
