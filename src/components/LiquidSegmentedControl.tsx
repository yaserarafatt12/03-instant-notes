import React, { useRef, useState, useEffect, useCallback } from 'react';

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

/**
 * True Quest-grade iOS 26 Liquid Glass Hold-and-Scrub Refractive Lens.
 * Features:
 * - overflow-visible outer pill + clipped frosted inner shell
 * - Pointer hold-and-scrub with setPointerCapture
 * - Damped harmonic spring physics (stiffness: 420, damping: 32, mass: 0.72)
 * - Elastic velocity stretch (stretchScaleX) during scrubbing
 * - Blooming refractive lens bubble (blur(10px) saturate(220%) brightness(1.18))
 *   with top specular arc & cyan/violet prismatic bottom refraction
 * - Haptic ticks via navigator.vibrate on press, option crossing, and commit
 */
export function LiquidSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'sm',
  fullWidth = false,
}: LiquidSegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  const [trackSize, setTrackSize] = useState({ width: 0, height: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isLight, setIsLight] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('light')
  );

  const lastHapticIndexRef = useRef<number>(-1);
  const activePointerIdRef = useRef<number | null>(null);
  const justHandledPointerRef = useRef<boolean>(false);
  const prevXRef = useRef<number>(0);

  // Spring physics state (mirrors Quest NavigasiBawah.tsx stiffness/damping/mass)
  const springRef = useRef({
    initialized: false,
    x: 0,
    vx: 0,
    targetX: 0,
    scaleX: 1,
    vScaleX: 0,
    targetScaleX: 1,
    bubbleWidth: 0,
    rafId: 0 as number | 0,
    lastTime: 0,
  });

  const itemCount = Math.max(1, options.length);
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );
  // Keep explicit horizontal track padding in sync for exact concentric symmetry
  const PAD_X = size === 'xs' ? 3 : 4;
  const innerTrackWidth = Math.max(0, trackSize.width - PAD_X * 2);
  const slotWidth = innerTrackWidth > 0 ? innerTrackWidth / itemCount : 0;

  // Track dark/light theme class reactively
  useEffect(() => {
    const checkTheme = () => {
      setIsLight(document.documentElement.classList.contains('light'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Measure inner track dimensions responsively
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      setTrackSize({ width: el.clientWidth, height: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lens bubble dimensions: exact concentric match to each equal grid column
  const restingWidth = Math.max(24, slotWidth - 2);
  const holdingWidth = Math.max(38, slotWidth + 12);
  const bubbleWidth = isHolding ? holdingWidth : restingWidth;
  const restingHeight = Math.max(20, trackSize.height - PAD_X * 2);
  const holdingHeight = trackSize.height + 10;
  const bubbleHeight = isHolding ? holdingHeight : restingHeight;

  springRef.current.bubbleWidth = bubbleWidth;

  // Apply lens position & stretch directly to DOM for 120fps silky scrubbing
  const applyLensTransform = useCallback(() => {
    const el = lensRef.current;
    if (!el) return;
    const s = springRef.current;
    el.style.left = `${s.x - s.bubbleWidth / 2}px`;
    el.style.transform = `translate3d(0, -50%, 0) scaleX(${s.scaleX.toFixed(4)})`;
  }, []);

  // Start / step the damped harmonic oscillator RAF loop
  const ensureSpringRunning = useCallback(() => {
    const s = springRef.current;
    if (s.rafId) return;

    s.lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - s.lastTime) / 1000));
      s.lastTime = now;

      // Center X spring (stiffness: 420, damping: 32, mass: 0.72)
      const kX = 420;
      const cX = 32;
      const mX = 0.72;
      const forceX = -kX * (s.x - s.targetX) - cX * s.vx;
      const accX = forceX / mX;
      s.vx += accX * dt;
      s.x += s.vx * dt;

      // Stretch scaleX spring (stiffness: 360, damping: 26, mass: 1)
      const kS = 360;
      const cS = 26;
      const forceS = -kS * (s.scaleX - s.targetScaleX) - cS * s.vScaleX;
      s.vScaleX += forceS * dt;
      s.scaleX += s.vScaleX * dt;

      // Elastic decay of targetScaleX back to 1 when velocity settles
      if (s.targetScaleX > 1) {
        s.targetScaleX = Math.max(1, s.targetScaleX - dt * 1.4);
      }

      applyLensTransform();

      const settledX = Math.abs(s.x - s.targetX) < 0.15 && Math.abs(s.vx) < 0.5;
      const settledS = Math.abs(s.scaleX - 1) < 0.001 && Math.abs(s.vScaleX) < 0.01 && s.targetScaleX <= 1;

      if (settledX && settledS) {
        s.x = s.targetX;
        s.vx = 0;
        s.scaleX = 1;
        s.vScaleX = 0;
        applyLensTransform();
        s.rafId = 0;
        return;
      }

      s.rafId = requestAnimationFrame(step);
    };

    s.rafId = requestAnimationFrame(step);
  }, [applyLensTransform]);

  // Cleanup RAF on unmount
  useEffect(() => {
    const s = springRef.current;
    return () => {
      if (s.rafId) cancelAnimationFrame(s.rafId);
    };
  }, []);

  // Snap liquid bubble to active option when not actively holding/dragging
  useEffect(() => {
    if (!isHolding && slotWidth > 0) {
      const targetCenter = PAD_X + activeIndex * slotWidth + slotWidth / 2;
      const s = springRef.current;
      s.targetX = targetCenter;
      prevXRef.current = targetCenter;

      if (!s.initialized) {
        s.x = targetCenter;
        s.vx = 0;
        s.initialized = true;
        applyLensTransform();
      } else {
        ensureSpringRunning();
      }
    }
  }, [activeIndex, slotWidth, PAD_X, isHolding, applyLensTransform, ensureSpringRunning]);

  // Keep left offset synced immediately when bubbleWidth blooms/shrinks
  useEffect(() => {
    if (slotWidth > 0) {
      applyLensTransform();
    }
  }, [bubbleWidth, slotWidth, applyLensTransform]);

  const commitOptionByIndex = useCallback(
    (idx: number) => {
      const item = options[idx];
      if (!item) return;
      if (item.value !== value) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
        onChange(item.value);
      }
    },
    [options, value, onChange]
  );

  const getIndexFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || slotWidth <= 0) return { idx: activeIndex, clampedX: 0 };
      const rect = el.getBoundingClientRect();
      const relX = clientX - rect.left - PAD_X;
      const minCenter = PAD_X + slotWidth / 2;
      const maxCenter = PAD_X + innerTrackWidth - slotWidth / 2;
      const clampedX = Math.max(minCenter, Math.min(maxCenter, clientX - rect.left));
      const idx = Math.max(0, Math.min(itemCount - 1, Math.floor(relX / slotWidth)));
      return { idx, clampedX };
    },
    [activeIndex, innerTrackWidth, itemCount, PAD_X, slotWidth]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    activePointerIdRef.current = e.pointerId;
    justHandledPointerRef.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture is unsupported
    }

    const { idx, clampedX } = getIndexFromClientX(e.clientX);
    setIsHolding(true);
    setHoverIndex(idx);
    lastHapticIndexRef.current = idx;

    const s = springRef.current;
    s.targetX = clampedX;
    prevXRef.current = clampedX;
    ensureSpringRunning();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHolding || activePointerIdRef.current !== e.pointerId) return;
    const { idx, clampedX } = getIndexFromClientX(e.clientX);

    const velocity = Math.abs(clampedX - prevXRef.current);
    prevXRef.current = clampedX;

    const s = springRef.current;
    // Elastic horizontal stretch proportional to swipe speed
    s.targetScaleX = 1 + Math.min(0.14, velocity * 0.006);
    s.targetX = clampedX;
    ensureSpringRunning();

    if (idx !== lastHapticIndexRef.current) {
      lastHapticIndexRef.current = idx;
      setHoverIndex(idx);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(6);
      }
    }
  };

  const finishInteraction = (e: React.PointerEvent<HTMLDivElement>, shouldCommit: boolean) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }
    activePointerIdRef.current = null;
    justHandledPointerRef.current = true;
    window.setTimeout(() => {
      justHandledPointerRef.current = false;
    }, 0);

    const finalIdx = hoverIndex ?? activeIndex;
    setIsHolding(false);
    setHoverIndex(null);

    const s = springRef.current;
    s.targetScaleX = 1;

    if (shouldCommit) {
      commitOptionByIndex(finalIdx);
    }

    if (slotWidth > 0) {
      const snapCenter = PAD_X + (shouldCommit ? finalIdx : activeIndex) * slotWidth + slotWidth / 2;
      s.targetX = snapCenter;
      prevXRef.current = snapCenter;
      ensureSpringRunning();
    }
  };

  const displayActiveIndex = isHolding && hoverIndex !== null ? hoverIndex : activeIndex;

  const paddingClass = size === 'xs' ? 'p-[3px]' : 'p-[4px]';
  const heightClass = size === 'xs' ? 'h-8' : size === 'sm' ? 'h-9' : 'h-10';
  const itemPaddingClass =
    size === 'xs'
      ? 'px-2.5 text-[11.5px]'
      : size === 'sm'
      ? 'px-3.5 text-xs'
      : 'px-4 text-[13px]';

  return (
    <div
      className={`relative inline-flex items-center overflow-visible rounded-full select-none transition-transform duration-300 ${heightClass} ${
        isHolding ? 'scale-[1.015] z-30' : 'scale-100'
      } ${fullWidth ? 'w-full flex' : ''} ${className}`}
    >
      {/* Clipped Base Pill Background Layers (Exact Quest NavigasiBawah.tsx Architecture) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-full overflow-hidden border pointer-events-none ${
          isLight
            ? 'border-[#00A3FF]/25 shadow-[0_6px_18px_rgba(10,17,40,0.09)]'
            : 'border-white/18 shadow-[0_8px_28px_rgba(0,0,0,0.38)]'
        }`}
      >
        <div
          className="absolute inset-0 z-0 rounded-full"
          style={{
            backdropFilter: 'blur(24px) saturate(110%)',
            WebkitBackdropFilter: 'blur(24px) saturate(110%)',
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-full"
          style={{
            background: isLight
              ? 'rgba(255, 255, 255, 0.72)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(28, 32, 40, 0.52) 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-20 rounded-full"
          style={{
            boxShadow: isLight
              ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.82)'
              : 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.20), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.04)',
          }}
        />
      </div>

      {/* Interactive Hold-and-Scrub Track (Grid auto-cols-fr enforces equal slot widths) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishInteraction(e, true)}
        onPointerCancel={(e) => finishInteraction(e, false)}
        className={`relative z-30 grid grid-flow-col auto-cols-fr items-center w-full h-full touch-none select-none cursor-grab active:cursor-grabbing ${paddingClass}`}
      >
        {/* iOS 26 Liquid Glass Blooming Refractive Lens Bubble */}
        {slotWidth > 0 && (
          <div
            ref={lensRef}
            aria-hidden="true"
            className="absolute top-1/2 rounded-full pointer-events-none z-10 overflow-hidden will-change-transform"
            style={{
              width: `${bubbleWidth}px`,
              height: `${bubbleHeight}px`,
              transition:
                'width 260ms cubic-bezier(0.32, 1.35, 0.5, 1), height 260ms cubic-bezier(0.32, 1.35, 0.5, 1)',
            }}
          >
            {/* Main Refractive Glass Body */}
            <div
              className="w-full h-full rounded-full relative transition-all duration-200"
              style={{
                backdropFilter: isHolding
                  ? 'blur(12px) saturate(160%) brightness(1.14)'
                  : 'blur(12px) saturate(110%)',
                WebkitBackdropFilter: isHolding
                  ? 'blur(12px) saturate(160%) brightness(1.14)'
                  : 'blur(12px) saturate(110%)',
                background: isHolding
                  ? isLight
                    ? 'radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.78) 0%, rgba(240,244,250,0.45) 60%, rgba(200,210,225,0.28) 100%)'
                    : 'radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.28) 0%, rgba(210,218,230,0.16) 55%, rgba(255,255,255,0.10) 100%)'
                  : isLight
                    ? 'rgba(10, 17, 40, 0.08)'
                    : 'rgba(255, 255, 255, 0.16)',
                boxShadow: isHolding
                  ? isLight
                    ? 'inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.8)'
                    : 'inset 0 2px 3px rgba(255,255,255,0.72), inset 0 -2px 5px rgba(255,255,255,0.22), inset 2px 0 4px rgba(255,255,255,0.24), inset -2px 0 4px rgba(200,210,230,0.20), 0 10px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.36)'
                  : isLight
                    ? 'inset 0 1px 1px rgba(255,255,255,0.7)'
                    : 'inset 0 1px 1px rgba(255,255,255,0.22)',
              }}
            >
              {/* Full-bleed Top Specular Sheen (only when holding — no inner oval sticker) */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: isHolding ? 0.9 : 0,
                  background:
                    'radial-gradient(100% 70% at 50% 0%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.06) 55%, transparent 100%)',
                }}
              />
              {/* Bottom Prismatic Chromatic Refraction Rim */}
              <div
                className="absolute bottom-[1px] left-[12%] right-[12%] h-[4px] rounded-full blur-[1.5px] pointer-events-none transition-opacity duration-200"
                style={{
                  opacity: isHolding ? 0.75 : 0,
                  background:
                    'linear-gradient(90deg, rgba(200,220,255,0.75) 0%, rgba(255,255,255,0.9) 50%, rgba(215,205,255,0.75) 100%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Option Buttons */}
        {options.map((opt, idx) => {
          const isActive = displayActiveIndex === idx;
          const isBeingHeld = isHolding && hoverIndex === idx;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                // Keyboard / assistive click fallback (skip duplicate after pointerUp)
                if (justHandledPointerRef.current) return;
                commitOptionByIndex(idx);
              }}
              title={opt.title || opt.label}
              aria-pressed={opt.value === value}
              className={`relative z-20 h-full w-full flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 whitespace-nowrap select-none focus:outline-none ${itemPaddingClass} ${
                isActive
                  ? isLight
                    ? 'text-[#00A3FF]'
                    : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]'
                  : isLight
                    ? 'text-[#0A1128]/55 hover:text-[#0A1128]'
                    : 'text-white/55 hover:text-white/90'
              }`}
            >
              <span
                className="inline-flex items-center justify-center gap-1.5 transition-transform duration-200"
                style={{
                  transform: isBeingHeld
                    ? 'scale(1.1) translateY(-0.5px)'
                    : isActive
                    ? 'scale(1.03)'
                    : 'scale(0.98)',
                }}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                {opt.label && <span>{opt.label}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
