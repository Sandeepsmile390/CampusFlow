import React, { useId } from 'react';

export default function Logo({ className = '', iconOnly = false, size = 'md' }) {
  const gradientId = useId();
  const dimensions = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-12 w-12', text: 'text-3xl' },
    xl: { icon: 'h-16 w-16', text: 'text-4xl' },
  }[size] || { icon: 'h-8 w-8', text: 'text-xl' };

  // Detect if a text color override is passed in className to avoid CSS priority conflicts
  const hasColorOverride = className.split(' ').some(c => c.startsWith('text-'));
  const colorClass = hasColorOverride ? '' : 'text-[#0F172A] dark:text-[#F8FAFC]';

  return (
    <div className={`flex items-center gap-3 select-none ${colorClass} ${className}`}>
      {/* Monogram SVG */}
      <svg
        className={`${dimensions.icon} shrink-0 filter drop-shadow-[0_2px_8px_rgba(67,56,202,0.2)]`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="50%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {/* Cap Top Diamond */}
        <path
          fill={`url(#${gradientId})`}
          d="M50 10 L85 28 L50 46 L15 28 Z"
        />
        {/* Cap Bottom Wall */}
        <path
          fill={`url(#${gradientId})`}
          d="M32 36.5 L32 46 C32 53 68 53 68 46 L68 36.5"
          opacity="0.85"
        />
        {/* Cap Tassel */}
        <path
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          fill="none"
          d="M48 28.5 L24 38 L24 50"
        />
        <circle cx="24" cy="52" r="4" fill={`url(#${gradientId})`} />

        {/* Monogram Flowing Curves ("CF") */}
        <path
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          d="M25 75 C 28 62, 45 60, 55 70 C 65 80, 80 75, 88 65"
        />
        <path
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          d="M52 66 L78 66"
        />
      </svg>

      {!iconOnly && (
        <span className={`font-display font-bold tracking-tight ${dimensions.text}`}>
          <span className="text-current">Campus</span>
          <span className="text-campus-gradient">Flow</span>
        </span>
      )}
    </div>
  );
}
