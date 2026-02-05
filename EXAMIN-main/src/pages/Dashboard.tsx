import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import api from '../../api';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/signin');
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      try {
        const res = await api.get('/me', { auth: token });
        setProfile(res.user);
      } catch (e) {
        // no-op; user may not have a profile yet
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="py-12">
        <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-4">Profile Dashboard</h1>
          {user && (
            <div className="space-y-2 text-slate-700">
              <div><span className="font-medium">Email:</span> {user.email}</div>
              {profile?.name && <div><span className="font-medium">Name:</span> {profile.name}</div>}
            </div>
          )}
          <div className="mt-6">
            <button onClick={handleSignOut} className="px-4 py-2 rounded-lg bg-rose-600 text-white">Sign out</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
