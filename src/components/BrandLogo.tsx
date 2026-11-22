import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const boxSize = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 rounded-xl';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${boxSize} brand-squircle flex items-center justify-center shrink-0`}
        aria-hidden="true"
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.5 4.25H13.75L17.75 8.25V19.75C17.75 20.4404 17.1904 21 16.5 21H6.5C5.80964 21 5.25 20.4404 5.25 19.75V5.5C5.25 4.80964 5.80964 4.25 6.5 4.25Z"
            stroke="#FFFFFF"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M13.5 4.25V8.5H17.75"
            stroke="#FFFFFF"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 12.25H14.5M8.5 15.75H12.5"
            stroke="rgba(255,255,255,0.78)"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-white/95 leading-none">
          SeeNote
        </span>
      )}
    </div>
  );
};
