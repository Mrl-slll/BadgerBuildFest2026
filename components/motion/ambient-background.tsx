"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AmbientBackgroundProps {
  className?: string;
  particleCount?: number;
}

/**
 * AmbientBackground: Creates slow, high-variance ambient motion (12s - 20s cycles)
 * with a shifting gradient mesh and floating ethereal particles that contrast
 * with fast 150ms snappy micro-interactions.
 */
export function AmbientBackground({
  className = "",
  particleCount = 12,
}: AmbientBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  // Generate deterministic particle coordinates to avoid hydration mismatch
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      // Deterministic pseudo-random based on index
      const seed = (i * 9301 + 49297) % 233280;
      const left = ((seed / 233280) * 90 + 5).toFixed(1);
      const top = (((seed * 3) % 233280) / 233280 * 85 + 5).toFixed(1);
      const size = (((seed * 7) % 233280) / 233280 * 8 + 4).toFixed(1);
      const duration = (12 + ((seed * 11) % 233280) / 233280 * 8).toFixed(1);
      const delay = (((seed * 13) % 233280) / 233280 * 5).toFixed(1);
      return {
        id: i,
        left: `${left}%`,
        top: `${top}%`,
        size: `${size}px`,
        duration: parseFloat(duration),
        delay: parseFloat(delay),
      };
    });
  }, [particleCount]);

  if (shouldReduceMotion) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden opacity-30 ${className}`}
        aria-hidden="true"
      >
        <div
          className="absolute -top-[20%] -right-[15%] w-[450px] h-[450px] rounded-full filter blur-[70px]"
          style={{ background: "radial-gradient(circle, #c8dfdb 0%, transparent 70%)" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Slow Shifting Gradient Mesh (18s duration) */}
      <motion.div
        className="absolute -top-[20%] -right-[10%] w-[550px] h-[550px] rounded-full filter blur-[90px] opacity-45 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(200, 223, 219, 0.85) 0%, rgba(102, 163, 191, 0.4) 50%, transparent 75%)",
        }}
        animate={{
          scale: [1, 1.15, 0.95, 1],
          x: [0, 25, -20, 0],
          y: [0, -35, 15, 0],
          opacity: [0.35, 0.5, 0.4, 0.35],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute -bottom-[25%] -left-[10%] w-[480px] h-[480px] rounded-full filter blur-[80px] opacity-35 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(102, 163, 191, 0.5) 0%, rgba(51, 104, 160, 0.25) 50%, transparent 75%)",
        }}
        animate={{
          scale: [1, 0.9, 1.12, 1],
          x: [0, -25, 20, 0],
          y: [0, 25, -15, 0],
          opacity: [0.25, 0.45, 0.3, 0.25],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ambient Floating Particles (12s - 20s individual gentle drift) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background:
              p.id % 2 === 0
                ? "rgba(102, 163, 191, 0.35)"
                : "rgba(36, 101, 99, 0.25)",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -28, 12, 0],
            x: [0, 14, -14, 0],
            opacity: [0.2, 0.65, 0.3, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
