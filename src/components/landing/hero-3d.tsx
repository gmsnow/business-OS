"use client";

import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Sparkles, Stars } from "@react-three/drei";

const TEAL = "#03EABC";
const BLUE = "#0263D1";
const TEAL_RGBA = "rgba(3,234,188,";
const BLUE_RGBA = "rgba(2,99,209,";

const EARTH_RADIUS = 1.75;

const ATMOSPHERE_VERT = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAG = `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(0.25, 0.6, 1.0, 1.0) * intensity;
  }
`;

function useEarthTextures() {
  const daySource = useLoader(
    THREE.TextureLoader,
    "/earth/earth_atmos_2048.jpg",
  );
  const normalSource = useLoader(
    THREE.TextureLoader,
    "/earth/earth_normal_2048.jpg",
  );
  const specularSource = useLoader(
    THREE.TextureLoader,
    "/earth/earth_specular_2048.jpg",
  );
  const cloudsSource = useLoader(
    THREE.TextureLoader,
    "/earth/earth_clouds_1024.png",
  );

  const dayMap = useMemo(() => {
    const t = daySource.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [daySource]);

  const cloudsMap = useMemo(() => {
    const t = cloudsSource.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [cloudsSource]);

  return { dayMap, normalMap: normalSource, specularMap: specularSource, cloudsMap };
}

function PlanetEarth() {
  const group = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const { dayMap, normalMap, specularMap, cloudsMap } = useEarthTextures();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.05;
      group.current.position.y = Math.sin(t * 0.5) * 0.08;

      const targetRotX = pointer.current.y * 0.22 - 0.12;
      const targetRotY = pointer.current.x * 0.3 + t * 0.03;
      const max = 0.1;
      const pxd = THREE.MathUtils.clamp(
        targetRotY - group.current.rotation.y,
        -max,
        max,
      );
      group.current.rotation.y += pxd;
      const prd = THREE.MathUtils.clamp(
        targetRotX - group.current.rotation.x,
        -max,
        max,
      );
      group.current.rotation.x += prd;
    }
    if (clouds.current) {
      clouds.current.rotation.y += delta * 0.022;
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.12;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.08;
  });

  return (
    <group ref={group} position={[0, 0, 0]} rotation={[-0.12, 0, 0]}>
      {/* Earth */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={[0.85, 0.85]}
          specularMap={specularMap}
          specular={new THREE.Color("#222222")}
          shininess={8}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={clouds}>
        <sphereGeometry args={[EARTH_RADIUS * 1.012, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={EARTH_RADIUS * 1.18}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          args={[
            {
              vertexShader: ATMOSPHERE_VERT,
              fragmentShader: ATMOSPHERE_FRAG,
            },
          ]}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Orbit rings */}
      <group rotation={[Math.PI / 2.55, 0, 0]}>
        <mesh ref={ringA}>
          <torusGeometry args={[2.6, 0.01, 8, 160]} />
          <meshBasicMaterial color={TEAL} transparent opacity={0.5} />
        </mesh>
      </group>
      <group rotation={[Math.PI / 1.85, 0.6, 0]}>
        <mesh ref={ringB}>
          <torusGeometry args={[3.1, 0.007, 8, 192]} />
          <meshBasicMaterial color={BLUE} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Space dust */}
      <Sparkles count={70} scale={6.5} size={2.2} speed={0.35} color={TEAL} />
      <Sparkles count={35} scale={4.5} size={1.6} speed={0.2} color={BLUE} />
    </group>
  );
}

export default function Hero3D() {
  const [supported] = useState(() => detectWebGL());

  if (!supported) {
    return (
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute top-1/2 left-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
          style={{
            background: `radial-gradient(circle, ${TEAL_RGBA}0.07) 0%, ${BLUE_RGBA}0.05) 45%, transparent 70%)`,
          }}
        />
        <div
          className="absolute h-72 w-72 rounded-full border border-teal-300/25 animate-spin"
          style={{ borderTopColor: TEAL, animationDuration: "7s" }}
        />
        <div
          className="absolute h-52 w-52 rounded-full border border-blue-400/20 animate-spin"
          style={{
            borderBottomColor: BLUE,
            animationDirection: "reverse",
            animationDuration: "5s",
          }}
        />
        <div className="absolute h-28 w-28 rounded-full bg-teal-400/25 blur-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Soft halo behind the planet */}
      <div
        className="absolute top-1/2 left-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${TEAL_RGBA}0.06) 0%, ${BLUE_RGBA}0.05) 45%, transparent 70%)`,
        }}
      />
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.9} color="#ffffff" />
        <pointLight
          position={[-6, -2, -4]}
          intensity={40}
          color={BLUE}
          distance={30}
        />
        <Suspense fallback={null}>
          <PlanetEarth />
          <Stars radius={80} depth={40} count={2500} factor={3.5} saturation={0} fade speed={0.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}