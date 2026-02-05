import React from 'react';
import { Heart, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Examido
              </span>
            </div>
            <p className="text-slate-300 mb-4" style={{ fontFamily: 'Lato, sans-serif' }}>
              Connecting students with experienced guides for stress-free exam experiences. 
              Building a supportive community where everyone succeeds together.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              For Students
            </h3>
            <ul className="space-y-2 text-slate-300" style={{ fontFamily: 'Lato, sans-serif' }}>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Find a Guide</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              For Guides
            </h3>
            <ul className="space-y-2 text-slate-300" style={{ fontFamily: 'Lato, sans-serif' }}>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Become a Guide</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Guide Instructions</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Community</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm" style={{ fontFamily: 'Lato, sans-serif' }}>
            © 2025 Examido. All rights reserved.
          </p>
          {/* <p className="text-slate-400 text-sm mt-2 md:mt-0" style={{ fontFamily: 'Lato, sans-serif' }}>
            Built with ❤️ by <a rel="nofollow" target="_blank" href="https://meku.dev" className="text-emerald-400 hover:text-emerald-300 transition-colors">Meku.dev</a>
          </p> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;