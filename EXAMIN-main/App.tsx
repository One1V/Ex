import React from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Using HashRouter to avoid 404 on static host refreshes (no server-side rewrites needed)
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './src/pages/Home';
import StudentSignup from './src/pages/StudentSignup';
import FindMentor from './src/pages/FindMentor';
import BecomeMentor from './src/pages/BecomeMentor';
import JourneyTogether from './src/pages/JourneyTogether';
import JourneyTracker from './src/pages/JourneyTracker';
import BookSession from './src/pages/BookSession';
import MySessions from './src/pages/MySessions';
import NotFound from './src/pages/NotFound';
import SignIn from './src/pages/SignIn';
import ForgotPassword from './src/pages/ForgotPassword';
import Dashboard from './src/pages/Dashboard';
import Blog from './src/pages/Blog';
import Admin from './src/pages/Admin';
import { AuthProvider } from './src/context/AuthContext';
import RoleProtectedRoute from './src/components/RoleProtectedRoute';
import ProtectedRoute from './src/components/ProtectedRoute';
import GuideProfile from './src/pages/GuideProfile';

const App: React.FC = () => {
  return (
    <Theme appearance="inherit" radius="large" scaling="100%">
      <AuthProvider>
        <Router>
          <main className="min-h-screen">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/student-signup" element={<StudentSignup />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/find-mentor" element={<ProtectedRoute><FindMentor /></ProtectedRoute>} />
            <Route path="/become-mentor" element={<ProtectedRoute><BecomeMentor /></ProtectedRoute>} />
            <Route path="/journey-together" element={<ProtectedRoute><JourneyTogether /></ProtectedRoute>} />
            <Route path="/journey-tracker" element={<ProtectedRoute><JourneyTracker /></ProtectedRoute>} />
            <Route path="/book-session/:guideId" element={<ProtectedRoute><BookSession /></ProtectedRoute>} />
            <Route path="/my-sessions" element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
            <Route path="/mentor/:id/book" element={<BookSession />} />
            <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
            <Route path="/guide" element={<ProtectedRoute><RoleProtectedRoute role="guide"><GuideProfile /></RoleProtectedRoute></ProtectedRoute>} />
            <Route path="/admin" element={<Admin />} />
              <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              newestOnTop
              closeOnClick
              pauseOnHover
            />
          </main>
        </Router>
      </AuthProvider>
    </Theme>
  );
}

export default App;
