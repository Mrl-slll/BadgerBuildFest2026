"use client";

import type React from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
  innerStrength?: number;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  asChild?: boolean;
}

/**
 * Compatibility wrapper for existing call sites.
 * Cursor tracking and spring scaling were intentionally removed so buttons
 * remain spatially stable and rely on color, border, and focus feedback.
 */
export function MagneticButton({
  children,
  className = "",
  onClick,
}: MagneticButtonProps) {
  return (
    <div className={`inline-block relative ${className}`} onClick={onClick}>
      {children}
    </div>
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
 * Stable wrapper retained for cards and chips that previously used spring
 * transforms. Interaction feedback now comes from each control's CSS.
 */
export function PhysicsInteractive({
  children,
  className = "",
  onClick,
}: PhysicsInteractiveProps) {
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
}
