import React, { useState, useEffect } from 'react';
import { Menu, X, Heart, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Small helper for class merging (kept minimal to avoid adding deps)
function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, role } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/find-mentor', label: 'Find Guide' },
    { to: '/become-mentor', label: 'Become Guide' },
    { to: '/journey-together', label: 'Journey Together' },
    { to: '/journey-tracker', label: 'Journey Tracker' },
    { to: '/blog', label: 'Blog' },
    ...(user && role === 'guide' ? [{ to: '/my-sessions', label: 'Your Orders' }] as const : []),
    ...(user && role === 'user' ? [{ to: '/my-sessions', label: 'Your Bookings' }] as const : []),
    ...(role === 'guide' ? [{ to: '/guide', label: 'Guide' }] as const : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin' }] as const : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <header
      className={cx(
        'fixed top-0 inset-x-0 z-40 transition-all duration-300',
        'backdrop-blur-md supports-[backdrop-filter]:bg-white/70 bg-white/90',
        'border-b before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/50 before:to-transparent',
        scrolled ? 'shadow-lg/30 shadow-sm py-1' : 'py-2'
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-10 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl animate-pulse [animation-delay:400ms]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cx('flex items-center justify-between transition-all duration-300', scrolled ? 'h-14' : 'h-16')}>
          <Link to="/" className="group flex items-center space-x-2 relative">
            <span className="absolute -inset-2 rounded-lg bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:via-emerald-500/10 transition-all duration-500" />
            <Heart className="h-8 w-8 text-emerald-600 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
            <span
              className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Examido
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  'relative px-4 py-2 font-medium text-sm rounded-lg transition-all duration-300 group',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                  'text-slate-600 hover:text-emerald-700',
                  isActive(item.to) && 'text-emerald-700'
                )}
              >
                <span className="relative z-10" style={{ fontFamily: 'Lato, sans-serif' }}>{item.label}</span>
                <span
                  className={cx(
                    'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    'bg-gradient-to-br from-emerald-50 via-white to-emerald-50'
                  )}
                />
                <span
                  className={cx(
                    'absolute left-1/2 -translate-x-1/2 bottom-1 h-[2px] w-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 rounded-full transition-all duration-500',
                    'group-hover:w-4/5',
                    isActive(item.to) && 'w-4/5'
                  )}
                />
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                className={cx(
                  'relative ml-3 inline-flex items-center justify-center overflow-hidden rounded-full w-10 h-10',
                  'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60'
                )}
                title="Profile"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                to="/student-signup"
                className={cx(
                  'relative ml-3 inline-flex items-center justify-center overflow-hidden rounded-xl px-5 py-2.5 font-semibold text-sm',
                  'text-white transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                  'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-500 shadow-sm hover:shadow-emerald-500/30'
                )}
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 opacity-0 hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)] transition-opacity duration-500" />
              </Link>
            )}

            
          </nav>

          <button
            className={cx(
              'md:hidden relative p-2 rounded-lg transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
              'hover:bg-emerald-50'
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Menu</span>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cx(
            'md:hidden origin-top overflow-hidden transition-all duration-300',
            isMenuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="pt-2 pb-6 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  'block relative px-4 py-3 rounded-lg font-medium text-sm transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                  isActive(item.to) ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                )}
              >
                {item.label}
                {isActive(item.to) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                className="block relative mt-4 px-5 py-3 rounded-xl font-semibold text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
              >
                Profile Dashboard
              </Link>
            ) : (
              <Link
                to="/student-signup"
                className="block relative mt-4 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 shadow-sm hover:shadow-emerald-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* Spacer only on non-home pages to offset fixed header height.
        Home page ("/") has its own hero spacing, so we skip it there. */}
    {location.pathname !== '/' && (
      <div aria-hidden="true" className={scrolled ? 'h-16' : 'h-20'} />
    )}
    </>
  );
};

export default Header;
