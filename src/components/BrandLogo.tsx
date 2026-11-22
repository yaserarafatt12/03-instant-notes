import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  const iconSize = size === 'sm' ? 20 : 23;
  const textClass =
    size === 'sm'
      ? 'text-[17px] font-bold tracking-[-0.025em]'
      : 'text-[20px] font-bold tracking-[-0.025em]';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.16)]"
        aria-hidden="true"
      >
        {/* Back layered sheet silhouette */}
        <path
          d="M7.5 3.75H16.5C17.6046 3.75 18.5 4.64543 18.5 5.75V16.75"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Front folded note sheet */}
        <path
          d="M5.75 6.75H13.25L16.75 10.25V19C16.75 19.6904 16.1904 20.25 15.5 20.25H5.75C5.05964 20.25 4.5 19.6904 4.5 19V8C4.5 7.30964 5.05964 6.75 5.75 6.75Z"
          fill="rgba(255,255,255,0.12)"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M13 6.75V10.5H16.75"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.75 13.75H13.5M7.75 16.75H11.5"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className={`${textClass} text-white leading-none`}>
          SeeNote
        </span>
      )}
    </div>
  );
};
