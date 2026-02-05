import React from 'react';
import { UserPlus, Search, Calendar, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      description: "Tell us about your exam, city, and what kind of support you need - travel guidance and stay support."
    },
    {
      icon: Search,
      title: "Find Your Guide",
      description: "Browse verified guides who've taken exams in your city. Read their profiles, ratings, and specialties to find the perfect match."
    },
    {
      icon: Calendar,
      title: "Book Support",
      description: "Schedule your guiding sessions - pre-exam travel planning . Choose what works for you."
    },
    {
      icon: Heart,
      title: "Succeed Together",
      description: "Get personalized guidance, feel supported, and ace your exam. Then consider becoming a guide to help the next student!"
    }
  ];

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-br from-emerald-50 to-sky-50">
      {/* 🌊 Contrasting Fluid Gradient Wave Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Wave Shape Animation */}
        <motion.div
          className="absolute w-full h-full bg-gradient-to-r from-emerald-200 via-sky-200 to-yellow-100 opacity-30"
          style={{ clipPath: "ellipse(70% 100% at 50% 50%)" }}
          animate={{
            x: [0, -50, 0],
            y: [0, 20, -20, 0],
            scale: [1, 1.02, 0.98, 1],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Second Wave Layer for depth */}
        <motion.div
          className="absolute w-full h-full bg-gradient-to-r from-sky-300 via-emerald-200 to-yellow-200 opacity-20"
          style={{ clipPath: "ellipse(65% 95% at 50% 55%)" }}
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 20, 0],
            scale: [1, 1.03, 0.97, 1],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 🌟 Main Content */}
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 break-words" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            How ExamGuide Works
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto break-words hyphens-auto leading-relaxed" style={{ fontFamily: 'Lato, sans-serif', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            Getting support for your exam journey is simple. Connect with guides who understand exactly what you're going through.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center flex flex-col items-center h-full"
              >
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm shrink-0">
                  <IconComponent className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3 px-2 break-words" style={{ fontFamily: 'Montserrat, sans-serif', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed px-3 pb-2 text-sm sm:text-base break-words hyphens-auto" style={{ fontFamily: 'Lato, sans-serif', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
