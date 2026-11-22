import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
}) => {
  if (!showWordmark) return null;

  const textClass =
    size === 'sm'
      ? 'text-[18px] font-extrabold tracking-[-0.03em]'
      : 'text-[21px] font-extrabold tracking-[-0.03em]';

  return (
    <div className="flex items-center select-none">
      <span className={`${textClass} text-white leading-none`}>
        SeeNote
      </span>
    </div>
  );
};
