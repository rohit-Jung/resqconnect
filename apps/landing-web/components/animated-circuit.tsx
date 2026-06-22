'use client';

import { animate, createDrawable, createMotionPath } from 'animejs';
import { useEffect, useRef, useState } from 'react';

/* ──────────────────────────────────────────
   Flow Circuit — animated SVG path
   Swiss design: geometric, minimal, monochrome + red accent
   ────────────────────────────────────────── */

export function AnimatedCircuit() {
  const [ready, setReady] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const drawRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGElement>(null);
  const resolvedRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!pathRef.current || !drawRef.current || !dotRef.current) return;
    setReady(true);

    const path = pathRef.current;
    const draw = drawRef.current;
    const dot = dotRef.current;

    // 1. Draw the path
    const drawAnim = animate(createDrawable(draw), {
      draw: '0 1',
      duration: 2000,
      easing: 'easeInOutCubic',
    });

    // 2. Move the dot along the path
    const dotAnim = animate(dot, {
      ...createMotionPath(path),
      rotate: 0,
      duration: 2500,
      easing: 'easeInOutCubic',
      delay: 800,
    });

    // 3. Pulse the resolved node after dot arrives
    let pulseAnim: any = null;
    if (resolvedRef.current) {
      pulseAnim = animate(resolvedRef.current, {
        scale: [1, 1.15, 1],
        opacity: [0.6, 1, 0.6],
        duration: 1200,
        easing: 'easeInOutCubic',
        delay: 3500,
        loop: 3,
      });
    }

    return () => {
      drawAnim?.cancel();
      dotAnim?.cancel();
      pulseAnim?.cancel();
    };
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox="0 0 400 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Base path (visible) */}
        <path
          ref={pathRef}
          d="M 84 60 L 176 60 L 200 60 L 316 60 L 340 60 L 340 196"
          className="stroke-foreground"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={ready ? 0.25 : 0}
          style={{ transition: 'opacity 0.3s' }}
        />

        {/* Draw overlay (animated) */}
        <path
          ref={drawRef}
          d="M 84 60 L 176 60 L 200 60 L 316 60 L 340 60 L 340 196"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="0 1000"
          opacity={ready ? 1 : 0}
          style={{ transition: 'opacity 0.3s' }}
        />

        {/* Nodes */}
        <g opacity={ready ? 1 : 0} style={{ transition: 'opacity 0.5s 0.2s' }}>
          {/* User */}
          <circle
            cx="60"
            cy="60"
            r="22"
            className="fill-background stroke-foreground"
            strokeWidth="1.5"
          />
          <text
            x="60"
            y="64"
            textAnchor="middle"
            className="fill-foreground text-[9px] font-mono font-semibold"
            dominantBaseline="middle"
          >
            USER
          </text>

          {/* Platform */}
          <circle
            cx="200"
            cy="60"
            r="22"
            className="fill-background stroke-foreground"
            strokeWidth="1.5"
          />
          <text
            x="200"
            y="64"
            textAnchor="middle"
            className="fill-foreground text-[9px] font-mono font-semibold"
            dominantBaseline="middle"
          >
            PLATFORM
          </text>

          {/* Responder */}
          <circle
            cx="340"
            cy="60"
            r="22"
            className="fill-background stroke-foreground"
            strokeWidth="1.5"
          />
          <text
            x="340"
            y="64"
            textAnchor="middle"
            className="fill-foreground text-[9px] font-mono font-semibold"
            dominantBaseline="middle"
          >
            RESPONDER
          </text>
        </g>

        {/* Resolved node */}
        <circle
          ref={resolvedRef}
          cx="340"
          cy="220"
          r="20"
          className="fill-primary stroke-primary"
          strokeWidth="1.5"
          opacity={ready ? 0.6 : 0}
          style={{ transition: 'opacity 0.3s' }}
        />
        <text
          x="340"
          y="224"
          textAnchor="middle"
          className="fill-primary-foreground text-[8px] font-mono font-semibold"
          dominantBaseline="middle"
          opacity={ready ? 1 : 0}
          style={{ transition: 'opacity 0.5s 0.3s' }}
        >
          ✓
        </text>

        {/* Moving dot */}
        <circle
          ref={dotRef as React.RefObject<SVGCircleElement>}
          cx="84"
          cy="60"
          r="5"
          className="fill-primary"
          opacity={ready ? 1 : 0}
          style={{ transition: 'opacity 0.3s' }}
        />

        {/* Labels */}
        <text
          x="200"
          y="92"
          textAnchor="middle"
          className="fill-muted-foreground text-[7px] font-mono"
          opacity={ready ? 1 : 0}
          style={{ transition: 'opacity 0.5s 0.5s' }}
        >
          HTTP + Kafka
        </text>
        <text
          x="360"
          y="133"
          className="fill-muted-foreground text-[7px] font-mono"
          opacity={ready ? 1 : 0}
          style={{ transition: 'opacity 0.5s 0.8s' }}
        >
          Socket.IO
        </text>
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────
   Step Icon — draws in on scroll
   ────────────────────────────────────────── */

interface StepIconProps {
  path: string;
  delay?: number;
}

export function AnimatedStepIcon({ path, delay = 0 }: StepIconProps) {
  const ref = useRef<SVGPathElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    const anim = animate(createDrawable(el), {
      draw: '0 1',
      duration: 1200,
      easing: 'easeOutCubic',
      delay,
    });

    return () => {
      anim?.cancel();
    };
  }, [delay]);

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        ref={ref as React.RefObject<SVGPathElement>}
        d={path}
        strokeDasharray="0 1000"
        opacity={mounted ? 1 : 0}
        style={{ transition: 'opacity 0.3s' }}
      />
    </svg>
  );
}

/* ──────────────────────────────────────────
   Icon set (feather-style SVG paths)
   ────────────────────────────────────────── */

export const ICONS = {
  phone:
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  mapPin:
    'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  navigation: 'M3 11l19-9-9 19-2-8-8-2z',
  radio:
    'M16 2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M8 12h8 M10 6h4',
} as const;
