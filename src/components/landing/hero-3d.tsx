"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls, Sparkles, Stars } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Store,
  ShoppingCart,
  Stethoscope,
  Globe,
  X,
  type LucideIcon,
} from "lucide-react";

const TEAL = "#03EABC";
const BLUE = "#0263D1";
const TEAL_RGBA = "rgba(3,234,188,";
const BLUE_RGBA = "rgba(2,99,209,";

const EARTH_RADIUS = 1.2;

const CAM_DISTANCE = 8;
const CAM_FOV = 45;
const CAM_START = 400;
const EARTH_MIN_SCALE = 0.03;

const FLIGHT_DELAY = 1;
const FLIGHT_DURATION = 5;
const CLUSTER_RESIDUAL = 0.12;

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

type GeoPoint = { lat: number; lon: number };

type LocationKind = "store" | "grocery" | "clinic";

type Location = GeoPoint & { kind: LocationKind; label: string };

type Phase = "cluster" | "earth";

const KIND_COLORS: Record<LocationKind, string> = {
  store: TEAL,
  grocery: "#FFC53D",
  clinic: "#4C9AFF",
};

const KIND_META: Record<
  LocationKind,
  { name: string; system: string; desc: string; icon: LucideIcon }
> = {
  store: {
    name: "المتاجر",
    system: "نظام المتاجر",
    desc: "إدارة المخزون والمبيعات والمشتريات ونقطة البيع لمتجرك من أي مكان في العالم.",
    icon: Store,
  },
  grocery: {
    name: "البقالة",
    system: "نظام البقالة",
    desc: "كل ما يحتاجه متجر البقالة: منتجات وباركود وموردين وعملاء وتقارير الربح.",
    icon: ShoppingCart,
  },
  clinic: {
    name: "المراكز الصحية",
    system: "نظام سما سنتر",
    desc: "إدارة المرضى والجلسات والمواعيد والكشوفات والمدفوعات لمركزك الصحي.",
    icon: Stethoscope,
  },
};

const LOCATIONS: Location[] = [
  { lat: 24.7, lon: 46.7, kind: "store", label: "الرياض" },
  { lat: 25.2, lon: 55.3, kind: "store", label: "دبي" },
  { lat: 30, lon: 31.2, kind: "clinic", label: "القاهرة" },
  { lat: 21.4, lon: 39.8, kind: "clinic", label: "جدة" },
  { lat: 51.5, lon: -0.1, kind: "grocery", label: "لندن" },
  { lat: 40.7, lon: -74, kind: "store", label: "نيويورك" },
  { lat: 35.7, lon: 139.7, kind: "grocery", label: "طوكيو" },
  { lat: -33.9, lon: 151.2, kind: "clinic", label: "سيدني" },
  { lat: 48.9, lon: 2.35, kind: "grocery", label: "باريس" },
  { lat: 1.35, lon: 103.8, kind: "store", label: "سنغافورة" },
];

const ARCS: Array<[GeoPoint, GeoPoint]> = [
  [{ lat: 24.7, lon: 46.7 }, { lat: 25.2, lon: 55.3 }],
  [{ lat: 40.7, lon: -74 }, { lat: 51.5, lon: -0.1 }],
  [{ lat: 48.9, lon: 2.35 }, { lat: 30, lon: 31.2 }],
  [{ lat: 25.2, lon: 55.3 }, { lat: 1.35, lon: 103.8 }],
  [{ lat: 35.7, lon: 139.7 }, { lat: -33.9, lon: 151.2 }],
];

function createStarTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  const half = size / 2;

  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.06, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.45)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.14)");
  gradient.addColorStop(0.75, "rgba(255,255,255,0.032)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const spike = ctx.createLinearGradient(0, 0, size, 0);
  spike.addColorStop(0, "rgba(255,255,255,0)");
  spike.addColorStop(0.43, "rgba(255,255,255,0.07)");
  spike.addColorStop(0.5, "rgba(255,255,255,0.18)");
  spike.addColorStop(0.57, "rgba(255,255,255,0.07)");
  spike.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spike;
  ctx.fillRect(0, half - 1, size, 2);
  ctx.fillRect(half - 1, 0, 2, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createClusterGeometry(): THREE.BufferGeometry {
  const count = 2600;
  const R = 170;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    "#ffffff",
    "#eef4ff",
    "#cfe0ff",
    "#a9c8ff",
    "#b8d6ff",
    "#ffe8c2",
  ];
  const v = new THREE.Vector3();
  const tmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const r = Math.cbrt(Math.random()) * R;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    v.setFromSphericalCoords(r, phi, theta);

    const i3 = i * 3;
    positions[i3] = v.x;
    positions[i3 + 1] = v.y;
    positions[i3 + 2] = v.z;

    tmp.set(palette[(Math.random() * palette.length) | 0]);
    const intensity = 0.7 + Math.random() * 0.9;
    colors[i3] = tmp.r * intensity;
    colors[i3 + 1] = tmp.g * intensity;
    colors[i3 + 2] = tmp.b * intensity;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

const STAR_TEXTURE = createStarTexture();
const CLUSTER_GEOMETRY = createClusterGeometry();

const NEBULA_SPRITES: Array<{ pos: [number, number, number]; scale: number }> = [
  { pos: [0, 0.4, -1.4], scale: 7 },
  { pos: [-1.8, -0.8, 0.8], scale: 6 },
  { pos: [1.6, 0.2, -0.6], scale: 5 },
  { pos: [0.4, -0.7, -2], scale: 8 },
];

function geoToXYZ(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * THREE.MathUtils.DEG2RAD;
  const theta = (lon + 180) * THREE.MathUtils.DEG2RAD;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

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

function GeoMarker({
  lat,
  lon,
  color,
  phase,
  active,
  interactive,
  onSelect,
}: {
  lat: number;
  lon: number;
  color: string;
  phase: number;
  active: boolean;
  interactive: boolean;
  onSelect: () => void;
}) {
  const dot = useRef<THREE.Mesh>(null);
  const ping = useRef<THREE.Mesh>(null);

  const { pos, quat } = useMemo(() => {
    const pos = geoToXYZ(lat, lon, EARTH_RADIUS * 1.02);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      pos.clone().normalize(),
    );
    return { pos, quat };
  }, [lat, lon]);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.55 + phase) % 1;
    if (ping.current) {
      if (active) {
        ping.current.scale.setScalar(0.3);
        const mat = ping.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.75;
      } else {
        ping.current.scale.setScalar(0.05 + t * 0.35);
        const mat = ping.current.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - t) * 0.6;
      }
    }
    if (dot.current) {
      const base = active
        ? 1.6
        : 0.85 + Math.sin(clock.elapsedTime * 3 + phase) * 0.2;
      dot.current.scale.setScalar(base);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!interactive) return;
    onSelect();
  };

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!interactive) return;
    document.body.style.cursor = "pointer";
  };

  const handleOut = () => {
    document.body.style.cursor = "auto";
  };

  return (
    <group position={pos} quaternion={quat}>
      <mesh ref={ping}>
        <ringGeometry args={[0.85, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={dot}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function NetworkArc({ from, to }: { from: GeoPoint; to: GeoPoint }) {
  const line = useMemo(() => {
    const p0 = geoToXYZ(from.lat, from.lon, EARTH_RADIUS * 1.02);
    const p1 = geoToXYZ(to.lat, to.lon, EARTH_RADIUS * 1.02);
    const mid = p0
      .clone()
      .add(p1)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(EARTH_RADIUS * 1.45);
    const points = new THREE.QuadraticBezierCurve3(p0, mid, p1).getPoints(48);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [from.lat, from.lon, to.lat, to.lon]);
  return <primitive object={line} />;
}

function PlanetEarth({
  selected,
  onSelect,
  onDeselect,
  interactive,
  earthRef,
}: {
  selected: Location | null;
  onSelect: (loc: Location) => void;
  onDeselect: () => void;
  interactive: boolean;
  earthRef: { current: THREE.Group | null };
}) {
  const group = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringMatA = useRef<THREE.MeshBasicMaterial>(null);
  const ringMatB = useRef<THREE.MeshBasicMaterial>(null);
  const fx = useRef<THREE.Group>(null);

  const { dayMap, normalMap, specularMap, cloudsMap } = useEarthTextures();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.5) * 0.08;
    }
    if (clouds.current) {
      clouds.current.rotation.y += delta * 0.022;
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.12;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.08;

    const s = earthRef.current?.scale.x ?? 0;
    const norm = (s - EARTH_MIN_SCALE) / (1 - EARTH_MIN_SCALE);
    const vis = THREE.MathUtils.smoothstep(norm, 0.45, 0.85);
    if (ringMatA.current) ringMatA.current.opacity = 0.5 * vis;
    if (ringMatB.current) ringMatB.current.opacity = 0.4 * vis;
    if (fx.current) fx.current.visible = norm > 0.3;
  });

  return (
    <group ref={group} position={[0, 0, 0]} rotation={[-0.12, 0, 0]} onClick={onDeselect}>
      <mesh onClick={onDeselect}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={[0.85, 0.85]}
          specularMap={specularMap}
          specular={new THREE.Color("#222222")}
          shininess={8}
        />
        {LOCATIONS.map((loc, i) => (
          <GeoMarker
            key={`${loc.lat}-${loc.lon}`}
            lat={loc.lat}
            lon={loc.lon}
            color={KIND_COLORS[loc.kind]}
            phase={i * 0.37}
            active={selected?.lat === loc.lat && selected?.lon === loc.lon}
            interactive={interactive}
            onSelect={() => onSelect(loc)}
          />
        ))}
        {ARCS.map(([a, b]) => (
          <NetworkArc
            key={`${a.lat}-${a.lon}-${b.lat}-${b.lon}`}
            from={a}
            to={b}
          />
        ))}
      </mesh>

      <mesh ref={clouds}>
        <sphereGeometry args={[EARTH_RADIUS * 1.012, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

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

      <group rotation={[Math.PI / 2.55, 0, 0]}>
        <mesh ref={ringA}>
          <torusGeometry args={[1.8, 0.01, 8, 160]} />
          <meshBasicMaterial ref={ringMatA} color={TEAL} transparent opacity={0.5} />
        </mesh>
      </group>
      <group rotation={[Math.PI / 1.85, 0.6, 0]}>
        <mesh ref={ringB}>
          <torusGeometry args={[2.1, 0.007, 8, 192]} />
          <meshBasicMaterial ref={ringMatB} color={BLUE} transparent opacity={0.4} />
        </mesh>
      </group>

      <group ref={fx}>
        <Sparkles count={70} scale={4.5} size={2.2} speed={0.35} color={TEAL} />
        <Sparkles count={35} scale={3.1} size={1.6} speed={0.2} color={BLUE} />
      </group>
    </group>
  );
}

function Cluster({ opacityRef }: { opacityRef: { current: number } }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.PointsMaterial>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.02;
    }
    if (material.current) {
      const shimmer =
        0.96 + 0.04 * Math.sin(state.clock.elapsedTime * 1.6);
      material.current.opacity = opacityRef.current * shimmer;
    }
  });

  return (
    <group ref={group}>
      <points geometry={CLUSTER_GEOMETRY}>
        <pointsMaterial
          ref={material}
          map={STAR_TEXTURE}
          size={18}
          sizeAttenuation={false}
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Nebula() {
  return (
    <>
      {NEBULA_SPRITES.map((n, i) => (
        <sprite key={i} position={n.pos} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial
            map={STAR_TEXTURE}
            color="#4a6fb8"
            transparent
            opacity={0.07}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </>
  );
}

function HeroScene({
  selected,
  onSelect,
  onDeselect,
  phase,
  onArrive,
}: {
  selected: Location | null;
  onSelect: (loc: Location) => void;
  onDeselect: () => void;
  phase: Phase;
  onArrive: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const earth = useRef<THREE.Group>(null);
  const spriteMat = useRef<THREE.SpriteMaterial>(null);
  const clusterOpacity = useRef(1);
  const arrived = useRef(false);

  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state) => {
    if (phase !== "earth") {
      const t = state.clock.elapsedTime;
      const ct = Math.max(0, t - FLIGHT_DELAY);
      const p = THREE.MathUtils.clamp(ct / FLIGHT_DURATION, 0, 1);

      const camZ =
        1 /
        THREE.MathUtils.lerp(
          1 / CAM_START,
          1 / CAM_DISTANCE,
          p,
        );
      camera.position.set(0, 0, camZ);
      camera.lookAt(target);

      if (earth.current) {
        earth.current.scale.setScalar(1);
      }
      if (spriteMat.current) {
        spriteMat.current.opacity =
          0.9 * (1 - THREE.MathUtils.smoothstep(p, 0.6, 0.9));
      }
      clusterOpacity.current =
        CLUSTER_RESIDUAL +
        (1 - CLUSTER_RESIDUAL) *
          (1 - THREE.MathUtils.smoothstep(p, 0.4, 0.9));

      if (controls.current) {
        controls.current.enabled = false;
      }

      if (p >= 1 && !arrived.current) {
        arrived.current = true;
        onArrive();
      }
    } else {
      if (earth.current) earth.current.scale.setScalar(1);
      if (spriteMat.current) spriteMat.current.opacity = 0;
      clusterOpacity.current = CLUSTER_RESIDUAL;

      if (controls.current) {
        controls.current.enabled = true;
      }
    }
  });

  return (
    <>
      <group>
        <Nebula />
        <Cluster opacityRef={clusterOpacity} />
        <group ref={earth}>
          <PlanetEarth
            selected={selected}
            onSelect={onSelect}
            onDeselect={onDeselect}
            interactive={phase === "earth"}
            earthRef={earth}
          />
          <sprite scale={[1.8, 1.8, 1]}>
            <spriteMaterial
              ref={spriteMat}
              map={STAR_TEXTURE}
              color="#7de8ff"
              transparent
              opacity={0.9}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        </group>
        <Stars radius={80} depth={40} count={2500} factor={3.5} saturation={0} fade speed={0.6} />
      </group>
      <OrbitControls
        ref={controls}
        enabled={phase === "earth"}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.55}
        minDistance={4.5}
        maxDistance={14}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.82}
        enablePan={false}
        target={new THREE.Vector3(0, 0, 0)}
      />
    </>
  );
}

export default function Hero3D({
  onReady,
}: {
  onReady?: () => void;
}) {
  const [supported] = useState(() => detectWebGL());
  const [selected, setSelected] = useState<Location | null>(null);
  const [phase, setPhase] = useState<Phase>("cluster");

  useEffect(() => {
    if (!supported) onReady?.();
  }, [supported, onReady]);

  if (!supported) {
    return (
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
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

  const Meta = selected ? KIND_META[selected.kind].icon : null;

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
          style={{
            background: `radial-gradient(circle, ${TEAL_RGBA}0.06) 0%, ${BLUE_RGBA}0.05) 45%, transparent 70%)`,
          }}
        />
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, CAM_START], fov: CAM_FOV }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0 }}
          onPointerMissed={() => setSelected(null)}
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
            <HeroScene
              selected={selected}
              onSelect={setSelected}
              onDeselect={() => setSelected(null)}
              phase={phase}
              onArrive={() => {
                setPhase("earth");
                onReady?.();
              }}
            />
          </Suspense>
        </Canvas>
      </div>

      {selected && Meta && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-md items-start gap-4 rounded-2xl border border-primary/20 bg-background/85 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${KIND_COLORS[selected.kind]}1a`, color: KIND_COLORS[selected.kind] }}>
              <Meta className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">
                  {KIND_META[selected.kind].system}{" "}
                  <span className="font-medium text-muted-foreground">
                    · {selected.label}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {KIND_META[selected.kind].desc}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href="/systems"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25 hover:brightness-110"
                >
                  استعرض النظام
                </Link>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <Globe className="h-3 w-3" />
                  يعمل حول العالم
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-8 end-6 z-20 hidden items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-[10px] text-muted-foreground/70 backdrop-blur-sm sm:inline-flex">
        {phase === "cluster" ? (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="text-primary">✦</span>
              مجموعة نجوم ساطعة
            </span>
            <span className="text-border">·</span>
            <span className="animate-pulse text-primary/80">نقترب من الأرض…</span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="text-primary">⟲</span>
              اسحب للتدوير
            </span>
            <span className="text-border">·</span>
            <span>سحب التمرير للتكبير</span>
          </>
        )}
      </div>
    </>
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