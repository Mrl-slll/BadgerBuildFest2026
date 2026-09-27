interface AnimatedFingerprintCycleProps {
  className?: string;
  size?: number;
}

/**
 * Static fingerprint emblem built from the supplied transparent artwork.
 * It deliberately has no orbit, pointer response, parallax, or hover scaling.
 */
export function AnimatedFingerprintCycle({
  className = "",
  size = 280,
}: AnimatedFingerprintCycleProps) {
  return (
    <div
      className={`relative grid place-items-center select-none ${className}`}
      style={{
        width: `min(100%, ${size}px)`,
        aspectRatio: "1973 / 2048",
        marginInline: "auto",
      }}
      aria-label="Fingerprint emblem symbolizing personal uniqueness"
      role="img"
    >
      <div
        className="absolute inset-[2%] pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(145deg, #246563 4%, #3368A0 48%, #66A3BF 72%, #246563 100%)",
          WebkitMaskImage: "url('/assets/fingerprint-icon.png')",
          maskImage: "url('/assets/fingerprint-icon.png')",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          filter: "drop-shadow(0 3px 3px rgba(36, 101, 99, 0.14))",
        }}
      />
    </div>
  );
}
