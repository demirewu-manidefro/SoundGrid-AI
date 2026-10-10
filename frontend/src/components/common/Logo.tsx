import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "h-8", 
  showText = true,
  textSize = "text-2xl"
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full aspect-square drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
      >
        <path 
          d="M4 16C4 9.37258 9.37258 4 16 4V4C22.6274 4 28 9.37258 28 16V16C28 22.6274 22.6274 28 16 28V28C9.37258 28 4 22.6274 4 16V16Z" 
          fill="url(#sg-gradient)" 
          fillOpacity="0.1" 
          stroke="url(#sg-gradient)" 
          strokeWidth="2"
        />
        <path d="M10 16L10 19" stroke="url(#sg-gradient)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 12L14 22" stroke="url(#sg-gradient)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M18 7L18 25" stroke="url(#sg-gradient)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M22 13L22 19" stroke="url(#sg-gradient)" strokeWidth="2.5" strokeLinecap="round"/>
        <defs>
          <linearGradient id="sg-gradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-bold tracking-tight text-white ${textSize} flex items-center`}>
          Sound<span className="text-[#34d399]">Grid</span>
        </span>
      )}
    </div>
  );
};
