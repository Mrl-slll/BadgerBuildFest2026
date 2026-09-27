"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 10,
};

export const snappyTransition = {
  duration: 0.15,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
  innerStrength?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  asChild?: boolean;
}

/**
 * Magnetic Button with Spring Physics
 * Uses stiffness: 400, damping: 10 with magnetic cursor tracking and 0.95 tap scale.
 */
export function MagneticButton({
  children,
  className = "",
  magneticStrength = 0.32,
  innerStrength = 0.18,
  onClick,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [innerPosition, setInnerPosition] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !buttonRef.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } =
        buttonRef.current.getBoundingClientRect();
      const middleX = clientX - (left + width / 2);
      const middleY = clientY - (top + height / 2);

      setPosition({
        x: middleX * magneticStrength,
        y: middleY * magneticStrength,
      });

      setInnerPosition({
        x: middleX * innerStrength,
        y: middleY * innerStrength,
      });
    },
    [magneticStrength, innerStrength, shouldReduceMotion],
  );

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setInnerPosition({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={buttonRef}
      className={`inline-block relative ${className}`}
      onPointerMove={handleMouseMove}
      onPointerLeave={handleMouseLeave}
      onClick={onClick}
      animate={shouldReduceMotion ? {} : { x: position.x, y: position.y }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      transition={springConfig}
      style={{ touchAction: "manipulation" }}
    >
      <motion.div
        animate={
          shouldReduceMotion ? {} : { x: innerPosition.x, y: innerPosition.y }
        }
        transition={springConfig}
        className="w-full h-full flex items-center justify-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface PhysicsInteractiveProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  scaleOnTap?: number;
  scaleOnHover?: number;
  yOnHover?: number;
}

/**
 * Lightweight spring physics wrapper for cards, chips, and list items.
 */
export function PhysicsInteractive({
  children,
  className = "",
  onClick,
  scaleOnTap = 0.95,
  scaleOnHover = 1.015,
  yOnHover = -2,
}: PhysicsInteractiveProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileTap={shouldReduceMotion ? {} : { scale: scaleOnTap }}
      whileHover={
        shouldReduceMotion ? {} : { scale: scaleOnHover, y: yOnHover }
      }
      transition={springConfig}
    >
      {children}
    </motion.div>
  );
}
