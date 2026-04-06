"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FloatingOrb } from "./FloatingOrb";

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 600;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const szs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      szs[i] = Math.random() * 2 + 0.5;
    }
    return [pos, szs];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    pointsRef.current.rotation.x =
      Math.sin(state.clock.getElapsedTime() * 0.01) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#7c5cfc"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function ConnectionLines() {
  const linesRef = useRef<THREE.LineSegments>(null);
  const lineCount = 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(lineCount * 6);
    for (let i = 0; i < lineCount; i++) {
      const x1 = (Math.random() - 0.5) * 12;
      const y1 = (Math.random() - 0.5) * 8;
      const z1 = (Math.random() - 0.5) * 6;
      const x2 = x1 + (Math.random() - 0.5) * 4;
      const y2 = y1 + (Math.random() - 0.5) * 3;
      const z2 = z1 + (Math.random() - 0.5) * 2;
      pos[i * 6] = x1;
      pos[i * 6 + 1] = y1;
      pos[i * 6 + 2] = z1;
      pos[i * 6 + 3] = x2;
      pos[i * 6 + 4] = y2;
      pos[i * 6 + 5] = z2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={lineCount * 2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#7c5cfc"
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.05) * 0.5;
    state.camera.position.y = Math.cos(t * 0.04) * 0.2;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#7c5cfc" />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="#22d3ee" />

        <FloatingOrb
          position={[-3.5, 1.5, -2]}
          color="#7c5cfc"
          color2="#e040e0"
          size={0.9}
          speed={0.8}
          floatAmplitude={0.4}
        />
        <FloatingOrb
          position={[3.8, -0.5, -3]}
          color="#22d3ee"
          color2="#7c5cfc"
          size={0.7}
          speed={1.1}
          floatAmplitude={0.35}
        />
        <FloatingOrb
          position={[0.5, -2.5, -1]}
          color="#e040e0"
          color2="#f472b6"
          size={0.5}
          speed={0.9}
          floatAmplitude={0.3}
        />
        <FloatingOrb
          position={[-1.5, -1, -4]}
          color="#7c5cfc"
          color2="#22d3ee"
          size={0.4}
          speed={1.3}
          floatAmplitude={0.25}
        />

        <Particles />
        <ConnectionLines />
        <CameraRig />
      </Canvas>
    </div>
  );
}
