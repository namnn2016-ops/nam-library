import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

export default function LogoIcon({ className = 'w-full h-full', size }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size || '100%'}
      height={size || '100%'}
      fill="none"
      className={className}
    >
      <defs>
        {/* Background Squircle Gradient */}
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Main Book "N" Primary Gradient */}
        <linearGradient id="primaryN" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>

        {/* Wing Right / Accent Gradient */}
        <linearGradient id="accentCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Diagonal Bridge "N" Gradient */}
        <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="60%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Gold Bookmark Ribbon Gradient */}
        <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Soft Glow Filter */}
        <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#4F46E5" floodOpacity="0.35" />
        </filter>
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#06B6D4" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Squircle Base Container */}
      <rect
        x="4"
        y="4"
        width="120"
        height="120"
        rx="30"
        fill="url(#bgGrad)"
        stroke="#4338CA"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Subtle ambient inner glow ring */}
      <rect
        x="5"
        y="5"
        width="118"
        height="118"
        rx="29"
        fill="none"
        stroke="url(#primaryN)"
        strokeWidth="1"
        strokeOpacity="0.2"
      />

      {/* Book Pages / Wings / Stylized "N" Mark */}
      <g filter="url(#subtleGlow)">
        {/* Left Vertical Pillar */}
        <path
          d="M 28 34 C 28 31.8 29.8 30 32 30 L 44 30 C 46.2 30 48 31.8 48 34 L 48 94 C 48 96.2 46.2 98 44 98 L 32 98 C 29.8 98 28 96.2 28 94 Z"
          fill="url(#primaryN)"
        />
        {/* Left Inner Page Highlight */}
        <path
          d="M 33 36 L 43 36 C 44 36 45 37 45 38 L 45 92 C 45 93 44 94 43 94 L 33 94 Z"
          fill="#EEF2FF"
          fillOpacity="0.12"
        />

        {/* Right Vertical Pillar */}
        <path
          d="M 80 34 C 80 31.8 81.8 30 84 30 L 96 30 C 98.2 30 100 31.8 100 34 L 100 94 C 100 96.2 98.2 98 96 98 L 84 98 C 81.8 98 80 96.2 80 94 Z"
          fill="url(#accentCyan)"
          filter="url(#cyanGlow)"
        />
        {/* Right Inner Page Highlight */}
        <path
          d="M 85 36 L 95 36 C 96 36 97 37 97 38 L 97 92 C 97 93 96 94 95 94 L 85 94 Z"
          fill="#E0F2FE"
          fillOpacity="0.25"
        />

        {/* Diagonal Dynamic Stroke */}
        <path
          d="M 44 30 L 52 30 C 54.5 30 56.5 31.2 57.8 33.2 L 84 76 L 84 96 C 84 97.5 82.5 98.2 81 97.5 L 44 38 Z"
          fill="url(#bridgeGrad)"
        />

        {/* Secondary Turning Page Arc */}
        <path
          d="M 48 64 L 78 94 C 79.5 95.5 82 94.5 82 92.5 L 82 86 L 56 56 Z"
          fill="#A5B4FC"
          fillOpacity="0.3"
        />
      </g>

      {/* Golden Central Bookmark Ribbon */}
      <g filter="url(#subtleGlow)">
        <path d="M 60 26 L 68 26 L 68 54 L 64 50 L 60 54 Z" fill="url(#goldRibbon)" />
      </g>

      {/* Floating Sparkles */}
      <path
        d="M 102 24 L 103.5 28.5 L 108 30 L 103.5 31.5 L 102 36 L 100.5 31.5 L 96 30 L 100.5 28.5 Z"
        fill="#FBBF24"
      />
      <circle cx="24" cy="40" r="1.5" fill="#38BDF8" fillOpacity="0.8" />
      <circle cx="106" cy="74" r="2" fill="#818CF8" fillOpacity="0.7" />
    </svg>
  );
}
