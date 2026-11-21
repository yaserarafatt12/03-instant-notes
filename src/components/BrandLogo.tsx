import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false }) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Bespoke Tempered-Glass Squircle with Architectural Folded-Sheet + Precision Nib Emblem */}
      <div className="w-7 h-7 rounded-[9px] brand-squircle flex items-center justify-center shrink-0 relative overflow-hidden">
        {/* Top Specular Edge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/55 to-transparent"
        />

        <svg
          className="w-[17px] h-[17px] q-text-primary relative z-10"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Architectural Chamfered Sheet Silhouette */}
          <path
            d="M5 2.75H11.6L15.75 6.9V15.5C15.75 16.4665 14.9665 17.25 14 17.25H5.75C4.7835 17.25 4 16.4665 4 15.5V3.75C4 3.19772 4.44772 2.75 5 2.75Z"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
          {/* Crisp Geometric Fold Facet */}
          <path
            d="M11.35 2.75V6.35C11.35 6.79183 11.7082 7.15 12.15 7.15H15.75"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          {/* Precision Pen-Nib / Spark Mark */}
          <path
            d="M9.5 8.8L10.45 10.95L12.6 11.9L10.45 12.85L9.5 15L8.55 12.85L6.4 11.9L8.55 10.95L9.5 8.8Z"
            fill="#38BDF8"
            fillOpacity="0.95"
          />
        </svg>
      </div>

      {!compact && (
        <span className="text-[15px] font-bold tracking-[-0.03em] q-text-primary leading-none">
          SeeNote
        </span>
      )}
    </div>
  );
};
