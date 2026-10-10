import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

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
      <header className="w-full flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            Sound<span className="text-emerald-400">Grid</span>
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6 text-sm font-semibold">
          <button className="text-gray-300 hover:text-white transition-colors">አማ</button>
          <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            to="/login"
            state={{ mode: 'register' }}
            className="bg-emerald-400 hover:bg-emerald-500 text-black px-6 py-2.5 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 -mt-16">
        <h2 className="text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight mb-6 text-center">
          <span className="text-white">Intelligent </span>
          <span className="text-emerald-400">Acoustics.</span>
        </h2>
        
        <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 text-center max-w-2xl flex items-center justify-center gap-2">
          AI anomaly detection, live telemetry, and acoustic diagnostics.
          <span className="w-1 h-5 bg-emerald-400 animate-pulse ml-1 inline-block"></span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            to="/login"
            className="bg-emerald-400 hover:bg-emerald-500 text-black px-8 py-3.5 rounded-lg font-bold tracking-wide transition-colors uppercase w-full sm:w-auto text-center shadow-[0_0_20px_rgba(52,211,153,0.4)]"
          >
            Get Started
          </Link>
          <Link 
            to="/login"
            className="bg-[#111111]/80 hover:bg-[#222222]/90 border border-white/10 text-white px-8 py-3.5 rounded-lg font-bold tracking-wide transition-all uppercase w-full sm:w-auto text-center backdrop-blur-sm"
          >
            Explore Platform
          </Link>
        </div>
      </main>

      {/* Bottom Explore Arrow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 opacity-60">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Explore</span>
        <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
};
