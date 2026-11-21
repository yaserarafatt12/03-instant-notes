import React, { useState } from 'react';

export interface LiquidSegmentOption<T extends string> {
  value: T;
  label?: string;
  icon?: React.ReactNode;
  title?: string;
}

interface LiquidSegmentedControlProps<T extends string> {
  options: LiquidSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
}

export function LiquidSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'sm',
  fullWidth = false,
}: LiquidSegmentedControlProps<T>) {
  const [isPressed, setIsPressed] = useState(false);
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );
  const count = Math.max(1, options.length);

  const paddingClass = size === 'xs' ? 'p-[3px]' : size === 'sm' ? 'p-1' : 'p-1';
  const itemPaddingClass =
    size === 'xs'
      ? 'px-2 py-1 text-[11px]'
      : size === 'sm'
      ? 'px-2.5 py-1.5 text-xs'
      : 'px-3.5 py-2 text-xs';

  return (
    <div
      className={`relative inline-flex items-center overflow-visible rounded-full select-none ${
        fullWidth ? 'w-full flex' : ''
      } ${className}`}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
    >
      {/* Frosted iOS 26 Liquid Glass Pill Shell */}
      <div className="absolute inset-0 rounded-full liquid-pill pointer-events-none" />

      {/* Inner Track */}
      <div className={`relative z-10 flex items-center w-full ${paddingClass}`}>
        {/* Sliding Refractive Glass Lens Pill */}
        <div
          aria-hidden="true"
          className="liquid-lens-slider liquid-lens-active absolute top-[3px] bottom-[3px] left-[3px] rounded-full pointer-events-none"
          style={{
            width: `calc((100% - 6px) / ${count})`,
            transform: `translateX(${activeIndex * 100}%) scale(${isPressed ? 1.04 : 1})`,
          }}
        >
          {/* Top curved specular highlight arc */}
          <span className="pointer-events-none absolute inset-x-2 top-[1px] h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          {/* Subtle bottom cyan/violet prismatic refraction edge */}
          <span className="pointer-events-none absolute inset-x-3 bottom-[0.5px] h-[1px] rounded-full bg-gradient-to-r from-sky-400/0 via-sky-400/50 to-violet-400/0" />
        </div>

        {/* Interactive Option Buttons */}
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.title || opt.label}
              aria-pressed={isActive}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-200 whitespace-nowrap ${itemPaddingClass} ${
                isActive
                  ? 'q-text-primary'
                  : 'q-text-muted hover:q-text-primary'
              }`}
            >
              {opt.icon && (
                <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-[1.03]' : ''}`}>
                  {opt.icon}
                </span>
              )}
              {opt.label && <span>{opt.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
