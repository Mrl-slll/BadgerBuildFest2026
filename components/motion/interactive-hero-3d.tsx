"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

function HealthSculpture() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const beadRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { pointer } = state;
    const t = performance.now() * 0.001;

    // Smoothly lerp group rotation to mouse pointer position with spring-like dampening
    const targetRotY = pointer.x * 0.85 + Math.sin(t * 0.2) * 0.15;
    const targetRotX = -pointer.y * 0.6 + Math.cos(t * 0.25) * 0.1;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.05,
    );

    // Subtle floating vertical motion
    groupRef.current.position.y = Math.sin(t * 0.9) * 0.12;

    // Gentle orbital movement for internal health cycle rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.25;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.2;
    }
    if (beadRef.current) {
      const angle = t * 0.6;
      beadRef.current.position.x = Math.cos(angle) * 1.8;
      beadRef.current.position.y = Math.sin(angle) * 0.9;
      beadRef.current.position.z = Math.sin(angle) * 0.8;
    }
  });

  return (
    <group ref={groupRef} scale={1.25}>
      {/* Central biological core (faceted teal health crystal) */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color="#66A3BF"
          roughness={0.25}
          metalness={0.15}
          wireframe={false}
          flatShading={true}
        />
      </mesh>

      {/* Primary cycle ring (deep awareness teal) */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.7, 0.045, 16, 64]} />
        <meshStandardMaterial
          color="#246563"
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>

      {/* Secondary longitudinal ring (calm medical blue) */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[2.0, 0.035, 16, 64]} />
        <meshStandardMaterial
          color="#3368A0"
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      {/* Orbiting balance node (soft pearl sage) */}
      <mesh ref={beadRef}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color="#C8DFDB"
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

export function InteractiveHero3D({ className = "" }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={`flex items-center justify-center pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <div className="w-40 h-40 rounded-full border border-[var(--accent-soft)] flex items-center justify-center bg-[var(--surface)] shadow-sm">
          <div className="w-24 h-24 rounded-full border border-[var(--sky)] opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full min-h-[220px] max-h-[380px] pointer-events-auto select-none ${className}`}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-4, -3, -2]} intensity={0.6} color="#66a3bf" />
          <pointLight position={[3, 4, 2]} intensity={0.5} color="#c8dfdb" />
          <HealthSculpture />
        </Canvas>
      </Suspense>
    </div>
  );
}

