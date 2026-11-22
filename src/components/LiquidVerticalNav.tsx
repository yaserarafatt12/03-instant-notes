import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface LiquidVerticalNavItem<T extends string> {
  value: T;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface LiquidVerticalNavProps<T extends string> {
  items: LiquidVerticalNavItem<T>[];
  activeValue: T | null;
  onSelect: (value: T) => void;
  className?: string;
}

/**
 * Vertical iOS 26 Liquid Glass Hold-and-Scrub Navigation Slider for desktop sidebars.
 * - Equal-height 40px rows for clean concentric symmetry
 * - Spring-animated vertical floating lens pill between active nav items
 * - Supports click and vertical hold-and-scrub pointer dragging
 */
export function LiquidVerticalNav<T extends string>({
  items,
  activeValue,
  onSelect,
  className = '',
}: LiquidVerticalNavProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  const [trackHeight, setTrackHeight] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isLight, setIsLight] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('light')
  );

  const activePointerIdRef = useRef<number | null>(null);
  const lastHapticIndexRef = useRef<number>(-1);
  const justHandledPointerRef = useRef<boolean>(false);
  const prevYRef = useRef<number>(0);

  const PAD_Y = 5;
  const itemCount = Math.max(1, items.length);
  const activeIndex = items.findIndex((item) => item.value === activeValue);
  const hasActive = activeIndex >= 0;
  const innerHeight = Math.max(0, trackHeight - PAD_Y * 2);
  const slotHeight = innerHeight > 0 ? innerHeight / itemCount : 0;

  const springRef = useRef({
    initialized: false,
    y: 0,
    vy: 0,
    targetY: 0,
    scaleY: 1,
    vScaleY: 0,
    targetScaleY: 1,
    bubbleHeight: 0,
    rafId: 0 as number | 0,
    lastTime: 0,
  });

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

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      setTrackHeight(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  const bubbleHeight = Math.max(32, isHolding ? slotHeight + 4 : slotHeight - 2);
  springRef.current.bubbleHeight = bubbleHeight;

  const applyLensTransform = useCallback(() => {
    const el = lensRef.current;
    if (!el) return;
    const s = springRef.current;
    el.style.top = `${s.y - s.bubbleHeight / 2}px`;
    el.style.transform = `translate3d(0, 0, 0) scaleY(${s.scaleY.toFixed(4)})`;
  }, []);

  const ensureSpringRunning = useCallback(() => {
    const s = springRef.current;
    if (s.rafId) return;
    s.lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - s.lastTime) / 1000));
      s.lastTime = now;

      const kY = 420;
      const cY = 32;
      const mY = 0.72;
      const forceY = -kY * (s.y - s.targetY) - cY * s.vy;
      s.vy += (forceY / mY) * dt;
      s.y += s.vy * dt;

      const kS = 360;
      const cS = 26;
      const forceS = -kS * (s.scaleY - s.targetScaleY) - cS * s.vScaleY;
      s.vScaleY += forceS * dt;
      s.scaleY += s.vScaleY * dt;

      if (s.targetScaleY > 1) {
        s.targetScaleY = Math.max(1, s.targetScaleY - dt * 1.4);
      }

      applyLensTransform();

      const settledY = Math.abs(s.y - s.targetY) < 0.15 && Math.abs(s.vy) < 0.5;
      const settledS = Math.abs(s.scaleY - 1) < 0.001 && Math.abs(s.vScaleY) < 0.01 && s.targetScaleY <= 1;

      if (settledY && settledS) {
        s.y = s.targetY;
        s.vy = 0;
        s.scaleY = 1;
        s.vScaleY = 0;
        applyLensTransform();
        s.rafId = 0;
        return;
      }

      s.rafId = requestAnimationFrame(step);
    };

    s.rafId = requestAnimationFrame(step);
  }, [applyLensTransform]);

  useEffect(() => {
    const s = springRef.current;
    return () => {
      if (s.rafId) cancelAnimationFrame(s.rafId);
    };
  }, []);

  useEffect(() => {
    if (!isHolding && slotHeight > 0 && hasActive) {
      const targetCenter = PAD_Y + activeIndex * slotHeight + slotHeight / 2;
      const s = springRef.current;
      s.targetY = targetCenter;
      prevYRef.current = targetCenter;

      if (!s.initialized) {
        s.y = targetCenter;
        s.vy = 0;
        s.initialized = true;
        applyLensTransform();
      } else {
        ensureSpringRunning();
      }
    }
  }, [activeIndex, hasActive, slotHeight, isHolding, applyLensTransform, ensureSpringRunning]);

  useEffect(() => {
    if (slotHeight > 0 && hasActive) {
      applyLensTransform();
    }
  }, [bubbleHeight, slotHeight, hasActive, applyLensTransform]);

  const commitItemByIndex = useCallback(
    (idx: number) => {
      const item = items[idx];
      if (!item) return;
      onSelect(item.value);
    },
    [items, onSelect]
  );

  const getIndexFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el || slotHeight <= 0) return { idx: Math.max(0, activeIndex), clampedY: PAD_Y + slotHeight / 2 };
      const rect = el.getBoundingClientRect();
      const relY = clientY - rect.top - PAD_Y;
      const minCenter = PAD_Y + slotHeight / 2;
      const maxCenter = PAD_Y + innerHeight - slotHeight / 2;
      const clampedY = Math.max(minCenter, Math.min(maxCenter, clientY - rect.top));
      const idx = Math.max(0, Math.min(itemCount - 1, Math.floor(relY / slotHeight)));
      return { idx, clampedY };
    },
    [activeIndex, innerHeight, itemCount, slotHeight]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    activePointerIdRef.current = e.pointerId;
    justHandledPointerRef.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if unsupported
    }

    const { idx, clampedY } = getIndexFromClientY(e.clientY);
    setIsHolding(true);
    setHoverIndex(idx);
    lastHapticIndexRef.current = idx;

    const s = springRef.current;
    if (!s.initialized) {
      s.y = clampedY;
      s.initialized = true;
    }
    s.targetY = clampedY;
    prevYRef.current = clampedY;
    ensureSpringRunning();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHolding || activePointerIdRef.current !== e.pointerId) return;
    const { idx, clampedY } = getIndexFromClientY(e.clientY);

    const velocity = Math.abs(clampedY - prevYRef.current);
    prevYRef.current = clampedY;

    const s = springRef.current;
    s.targetScaleY = 1 + Math.min(0.10, velocity * 0.005);
    s.targetY = clampedY;
    ensureSpringRunning();

    if (idx !== lastHapticIndexRef.current) {
      lastHapticIndexRef.current = idx;
      setHoverIndex(idx);
    }
  };

  const finishInteraction = (e: React.PointerEvent<HTMLDivElement>, shouldCommit: boolean) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    activePointerIdRef.current = null;
    justHandledPointerRef.current = true;
    window.setTimeout(() => {
      justHandledPointerRef.current = false;
    }, 0);

    const finalIdx = hoverIndex ?? Math.max(0, activeIndex);
    setIsHolding(false);
    setHoverIndex(null);

    const s = springRef.current;
    s.targetScaleY = 1;

    if (shouldCommit) {
      commitItemByIndex(finalIdx);
    }

    if (slotHeight > 0 && hasActive) {
      const snapCenter = PAD_Y + (shouldCommit ? finalIdx : activeIndex) * slotHeight + slotHeight / 2;
      s.targetY = snapCenter;
      prevYRef.current = snapCenter;
      ensureSpringRunning();
    }
  };

  const displayActiveIndex = isHolding && hoverIndex !== null ? hoverIndex : activeIndex;

  return (
    <div
      className={`relative rounded-2xl overflow-visible select-none border ${
        isLight
          ? 'bg-white/55 border-[#0A1128]/10'
          : 'bg-white/[0.03] border-white/[0.08]'
      } ${className}`}
    >
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishInteraction(e, true)}
        onPointerCancel={(e) => finishInteraction(e, false)}
        className="relative flex flex-col w-full px-[5px] py-[5px] touch-none select-none cursor-pointer"
      >
        {/* Sliding Vertical Liquid Glass Pill */}
        {(hasActive || isHolding) && slotHeight > 0 && (
          <div
            ref={lensRef}
            aria-hidden="true"
            className="absolute left-[5px] right-[5px] rounded-xl pointer-events-none z-10 overflow-hidden will-change-transform"
            style={{
              height: `${bubbleHeight}px`,
              transition: 'height 220ms cubic-bezier(0.32, 1.35, 0.5, 1)',
            }}
          >
            <div
              className="w-full h-full rounded-xl relative transition-all duration-200"
              style={{
                backdropFilter: isHolding
                  ? 'blur(14px) saturate(160%) brightness(1.12)'
                  : 'blur(12px) saturate(130%)',
                WebkitBackdropFilter: isHolding
                  ? 'blur(14px) saturate(160%) brightness(1.12)'
                  : 'blur(12px) saturate(130%)',
                background: isHolding
                  ? isLight
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(235,243,255,0.78) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.10) 100%)'
                  : isLight
                    ? 'rgba(10, 17, 40, 0.08)'
                    : 'rgba(255, 255, 255, 0.13)',
                boxShadow: isHolding
                  ? isLight
                    ? 'inset 0 1.5px 2px rgba(255,255,255,0.95), 0 6px 18px rgba(0,0,0,0.10), 0 0 0 1px rgba(10,17,40,0.12)'
                    : 'inset 0 1.5px 2px rgba(255,255,255,0.55), inset 0 -1px 3px rgba(255,255,255,0.18), 0 8px 22px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.30)'
                  : isLight
                    ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px rgba(10,17,40,0.08)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.16)',
              }}
            />
          </div>
        )}

        {/* Nav Row Buttons */}
        {items.map((item, idx) => {
          const isActive = displayActiveIndex === idx;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                if (justHandledPointerRef.current) return;
                commitItemByIndex(idx);
              }}
              className={`relative z-20 w-full h-10 flex items-center justify-between px-3 rounded-xl text-[14px] transition-colors duration-150 select-none focus:outline-none ${
                isActive
                  ? isLight
                    ? 'text-[#0A1128] font-semibold'
                    : 'text-white font-semibold'
                  : isLight
                    ? 'text-[#0A1128]/65 hover:text-[#0A1128] font-medium'
                    : 'text-white/65 hover:text-white/95 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/55'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs font-medium tabular-nums shrink-0 transition-colors ${
                    isActive ? 'text-white/90' : 'text-white/45'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
