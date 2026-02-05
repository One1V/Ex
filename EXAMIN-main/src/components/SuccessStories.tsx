import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const SuccessStories: React.FC = () => {
  const stories = [
    {
      id: 1,
      name: "Rahul Kumar",
      exam: "JEE Advanced",
      city: "Delhi",
      image: "/WhatsApp Image 2025-09-25 at 12.39.37_c09f671b.jpg",
      story: "My guide helped me navigate Delhi's metro system and found a quiet place near the exam center for last-minute revision. Her calm presence on exam morning made all the difference!",
      rating: 4,
      mentorHelp: "Travel & Stay support"
    },
    {
      id: 2,
      name: "Sneha Patel",
      exam: "NEET",
      city: "Pune",
      image: "/WhatsApp Image 2025-09-25 at 12.52.42_26f61157.jpg",
      story: "I was so nervous about traveling alone to Pune. My guide not only guided me to safe accommodation but also shared his exam strategies. I felt like I had a big brother looking out for me.",
      rating: 4,
      mentorHelp: "Travel + stay + Strategy session"
    },
    {
      id: 3,
      name: "Arjun Singh",
      exam: "CAT",
      city: "Bangalore",
      image: "/WhatsApp Image 2025-09-25 at 12.42.08_786f7f8d.jpg",
      story: "The traffic in Bangalore was my biggest worry. My guide shared the perfect route and timing. She even recommended a great breakfast place that kept me energized throughout the exam!",
      rating: 5,
      mentorHelp: "Local travel tips & Exam strategy"
    }
  ];

  return (
    <section className="relative overflow-hidden py-20 bg-white">
      {/* 🎨 Gradient Ribbon Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ribbon 1 */}
        <motion.div
          className="absolute w-[200%] h-[200%] bg-gradient-to-r from-emerald-200 via-sky-200 to-yellow-200 opacity-20 rounded-full"
          style={{ top: "-30%", left: "-50%" }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 120,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        {/* Ribbon 2 */}
        <motion.div
          className="absolute w-[200%] h-[200%] bg-gradient-to-r from-sky-300 via-emerald-100 to-yellow-100 opacity-15 rounded-full"
          style={{ top: "-20%", left: "-60%" }}
          animate={{
            rotate: [360, 0],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 140,
            repeat: Infinity,
            ease: "linear",
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
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Success Stories from Our Community
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto" style={{ fontFamily: 'Lato, sans-serif' }}>
            Real experiences from students who found support, guidance, and friendship through our guide network.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-emerald-50 to-sky-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="h-8 w-8 text-emerald-600 mb-4" />
              <p className="text-slate-700 mb-6 leading-relaxed" style={{ fontFamily: 'Lato, sans-serif' }}>
                "{story.story}"
              </p>
              <div className="flex items-center mb-4">
                {[...Array(story.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <div className="flex items-center mb-4">
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-semibold text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {story.name}
                  </h4>
                  <p className="text-sm text-slate-600" style={{ fontFamily: 'Lato, sans-serif' }}>
                    {story.exam} • {story.city}
                  </p>
                </div>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg">
                <p className="text-xs text-emerald-600 font-medium" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {story.mentorHelp}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
