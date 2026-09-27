"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface TracingDividerProps {
  className?: string;
  color?: string;
  duration?: number;
  variant?: "wave" | "geometric" | "pulse";
}

/**
 * TracingDivider: An SVG divider line that animates its path drawing itself onto the screen
 * using stroke-dasharray and stroke-dashoffset / pathLength animation.
 */
export function TracingDivider({
  className = "",
  color = "#66A3BF",
  duration = 1.6,
  variant = "wave",
}: TracingDividerProps) {
  const shouldReduceMotion = useReducedMotion();

  // Wave path: a gentle, calm organic wave reflecting health cycle rhythm
  const waveD =
    "M0,15 C200,32 400,-2 600,15 C800,32 1000,-2 1200,15";

  // Geometric path: a crisp architectural medical journal divider with subtle rhythm
  const geometricD =
    "M0,15 L350,15 L390,26 L430,4 L470,26 L510,15 L1200,15";

  // Pulse path: a gentle longitudinal rhythm line
  const pulseD =
    "M0,15 L280,15 Q340,15 360,5 T400,25 T440,15 L1200,15";

  const pathD =
    variant === "geometric"
      ? geometricD
      : variant === "pulse"
        ? pulseD
        : waveD;

  if (shouldReduceMotion) {
    return (
      <div className={`w-full overflow-hidden py-3 opacity-60 ${className}`}>
        <svg
          viewBox="0 0 1200 30"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-5"
          aria-hidden="true"
        >
          <path
            d={pathD}
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden py-3 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 30"
        fill="none"
        preserveAspectRatio="none"
        className="w-full h-5"
      >
        <motion.path
          d={pathD}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.45"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{
            pathLength: {
              duration,
              ease: [0.37, 0, 0.63, 1], // easeInOutSine
            },
            opacity: { duration: 0.4 },
          }}
        />
        {/* Subtle accent glow follower at key nodal points */}
        <motion.circle
          cx="430"
          cy="4"
          r="3"
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.8 }}
          viewport={{ once: true }}
          transition={{ delay: duration * 0.45, duration: 0.4 }}
        />
      </svg>
    </div>
  );
}

/**
 * TracingBox: Animated geometric border for cards or callouts
 */
export function TracingBox({
  children,
  className = "",
  strokeColor = "var(--accent-soft)",
}: {
  children: React.ReactNode;
  className?: string;
  strokeColor?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {!shouldReduceMotion && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.rect
            width="100%"
            height="100%"
            rx="12"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
