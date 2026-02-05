import React from 'react';
import { ArrowRight, Users, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-sky-50 py-20 lg:py-32">
      {/* 🌊 Soothing Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Blob 1 - Blue (Left Section) */}
        <motion.div
          className="absolute top-1/3 left-10 w-[28rem] h-[28rem] bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, 30, -30, 0],
            scale: [1, 1.05, 0.95, 1],
            opacity: [0.4, 0.5, 0.4, 0.4],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Blob 2 - Green (Right Section) */}
        <motion.div
          className="absolute top-1/4 right-20 w-[32rem] h-[32rem] bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"
          animate={{
            x: [0, -60, 60, 0],
            y: [0, 40, -40, 0],
            scale: [1, 1.04, 0.96, 1],
            opacity: [0.4, 0.5, 0.4, 0.4],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Blob 3 - Yellow (Bottom-middle) */}
        <motion.div
          className="absolute bottom-10 left-1/3 w-[26rem] h-[26rem] bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.03, 0.97, 1],
            opacity: [0.3, 0.4, 0.3, 0.3],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 🌟 Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Your Exam Journey,{' '}
              <span className="text-emerald-600">Supported</span>
            </h1>
            <p
              className="text-xl text-slate-600 mb-8 leading-relaxed"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              "Connect with experienced guides who've been where you're going.
              Get personalized guidance for exam travel, accommodation, and
              day-of support from a caring community"
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/student-signup"
                className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center group"
              >
                Find a Local Guide
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/become-mentor"
                className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors flex items-center justify-center"
              >
                Become a Guide
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">200+</p>
                <p className="text-slate-600 text-sm">Feedback taken</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-sky-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">80%</p>
                <p className="text-slate-600 text-sm">Conversion Rate</p>
              </div>
              <div className="text-center">
                <Heart className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">⭐</p>
                <p className="text-slate-600 text-sm">Ratings coming soon!</p>
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <img
              src="/freepik__a-natural-candid-photograph-showing-a-group-of-stu__46304.png"
              alt="Students studying together in a supportive environment"
              className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
