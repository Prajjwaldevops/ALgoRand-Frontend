"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FloatingOrbProps {
  position?: [number, number, number];
  color?: string;
  color2?: string;
  size?: number;
  speed?: number;
  floatAmplitude?: number;
}

export function FloatingOrb({
  position = [0, 0, 0],
  color = "#7c5cfc",
  color2 = "#22d3ee",
  size = 1,
  speed = 1,
  floatAmplitude = 0.5,
}: FloatingOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(color) },
      uColor2: { value: new THREE.Color(color2) },
    }),
    [color, color2]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(t * 0.6) * floatAmplitude;
      meshRef.current.position.x =
        position[0] + Math.cos(t * 0.4) * floatAmplitude * 0.3;
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current!.position);
      const scale = 1.8 + Math.sin(t) * 0.15;
      glowRef.current.scale.setScalar(scale);
    }
    uniforms.uTime.value = t;
  });

  return (
    <group>
      {/* Glow sphere */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main orb */}
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              vec3 pos = position;
              pos += normal * sin(pos.y * 3.0 + uTime) * 0.05;
              pos += normal * cos(pos.x * 2.5 + uTime * 0.7) * 0.03;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
              float noise = sin(vPosition.x * 8.0 + uTime) * cos(vPosition.y * 6.0 + uTime * 0.7) * 0.5 + 0.5;
              vec3 color = mix(uColor1, uColor2, noise * 0.7 + vUv.y * 0.3);
              color += fresnel * uColor2 * 0.6;
              float alpha = 0.75 + fresnel * 0.25;
              gl_FragColor = vec4(color, alpha);
            }
          `}
          transparent
        />
      </mesh>
    </group>
  );
}
