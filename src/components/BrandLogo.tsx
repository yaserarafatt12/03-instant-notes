import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false }) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Minimal Monochrome Tempered-Glass Squircle Emblem */}
      <div className="w-7 h-7 rounded-[9px] glass-control flex items-center justify-center shrink-0 relative overflow-hidden">
        <span className="pointer-events-none absolute inset-x-1 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <svg
          className="w-3.5 h-3.5 q-text-primary"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4.25 2.5H10.5L14.25 6.25V13.75C14.25 14.7165 13.4665 15.5 12.5 15.5H4.25C3.2835 15.5 2.5 14.7165 2.5 13.75V4.25C2.5 3.2835 3.2835 2.5 4.25 2.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10.25 2.5V6.5H14.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 9.5H11.25M5.5 12.25H9.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!compact && (
        <span className="text-[15px] font-bold tracking-tight q-text-primary leading-none">
          SeeNote
        </span>
      )}
    </div>
  );
};
