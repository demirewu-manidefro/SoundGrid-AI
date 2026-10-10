import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModal } from '../components/auth/AuthModal';
import { Logo } from '../components/common/Logo';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div 
      className="relative min-h-screen w-full bg-[#0a0a0a] text-white overflow-hidden flex flex-col"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.75), rgba(10, 10, 10, 0.85)), url('/hero-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <header className="w-full flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto relative z-20">
        {/* Logo */}
        <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/')}>
          <Logo className="h-8" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6 text-sm font-semibold">
          <button className="text-gray-300 hover:text-white transition-colors">አማ</button>
          <button 
            onClick={() => openAuthModal('login')} 
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => openAuthModal('register')}
            className="bg-emerald-400 hover:bg-emerald-500 text-black px-6 py-2.5 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]"
          >
            Register
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 -mt-16">
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
          <Logo className="h-20 md:h-28" showText={false} />
        </div>
        
        <h2 className="text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight mb-6 text-center">
          <span className="text-white">Intelligent </span>
          <span className="text-emerald-400">Acoustics.</span>
        </h2>
        
        <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 text-center max-w-2xl flex items-center justify-center gap-2">
          AI anomaly detection, live telemetry, and acoustic diagnostics.
          <span className="w-1 h-5 bg-emerald-400 animate-pulse ml-1 inline-block"></span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => openAuthModal('register')}
            className="bg-emerald-400 hover:bg-emerald-500 text-black px-8 py-3.5 rounded-lg font-bold tracking-wide transition-colors uppercase w-full sm:w-auto text-center shadow-[0_0_20px_rgba(52,211,153,0.4)]"
          >
            Get Started
          </button>
          <button 
            onClick={() => openAuthModal('login')}
            className="bg-[#111111]/80 hover:bg-[#222222]/90 border border-white/10 text-white px-8 py-3.5 rounded-lg font-bold tracking-wide transition-all uppercase w-full sm:w-auto text-center backdrop-blur-sm"
          >
            Explore Platform
          </button>
        </div>
      </main>

      {/* Bottom Explore Arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 opacity-60">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Explore</span>
        <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authModalMode}
      />
    </div>
  );
};
