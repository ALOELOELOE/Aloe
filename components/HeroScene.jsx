// Aloe - Hero 3D Scene (High Quality)
// Main crystal with orbiting elements on rings

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial, useProgress, Preload } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Loading tracker component
function LoadingTracker({ onLoaded }) {
  const { progress, loaded, total } = useProgress();

  useEffect(() => {
    if (progress === 100 || (loaded > 0 && loaded === total)) {
      const timer = setTimeout(() => {
        onLoaded?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, loaded, total, onLoaded]);

  return null;
}

// Main crystal with glass material
function MainCrystal({ position = [0, 0, 0], scale = 1 }) {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.y += 0.003;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x -= 0.003;
      innerRef.current.rotation.y -= 0.002;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position} scale={scale}>
        {/* Outer crystal */}
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.5, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={8}
            thickness={0.5}
            chromaticAberration={0.1}
            anisotropy={0.3}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.05}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            color="#10b981"
            transmission={0.95}
            roughness={0.05}
            ior={1.5}
            envMapIntensity={1}
          />
        </mesh>
        {/* Inner glowing core */}
        <mesh ref={innerRef} scale={0.4}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

// Small crystal that orbits along a ring path using shared angle
function RingCrystal({ radius, angleRef, offset = 0, color = "#6ee7b7", scale = 0.35 }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current && angleRef.current !== undefined) {
      // Use shared angle + offset for position
      const currentAngle = angleRef.current + offset;
      meshRef.current.position.x = Math.cos(currentAngle) * radius;
      meshRef.current.position.z = Math.sin(currentAngle) * radius;

      // Self-rotation
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.z += 0.008;
    }
  });

  return (
    <mesh ref={meshRef} position={[Math.cos(offset) * radius, 0, Math.sin(offset) * radius]} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <MeshTransmissionMaterial
        backside
        samples={6}
        thickness={0.4}
        chromaticAberration={0.15}
        anisotropy={0.2}
        distortion={0.1}
        distortionScale={0.15}
        temporalDistortion={0.03}
        iridescence={0.8}
        iridescenceIOR={1}
        iridescenceThicknessRange={[0, 1400]}
        color={color}
        transmission={0.9}
        roughness={0.1}
        ior={1.4}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

// Glass sphere that orbits along a ring path using shared angle
function RingSphere({ radius, angleRef, offset = 0, color = "#67e8f9", scale = 0.3 }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current && angleRef.current !== undefined) {
      // Use shared angle + offset for position
      const currentAngle = angleRef.current + offset;
      meshRef.current.position.x = Math.cos(currentAngle) * radius;
      meshRef.current.position.z = Math.sin(currentAngle) * radius;
    }
  });

  return (
    <mesh ref={meshRef} position={[Math.cos(offset) * radius, 0, Math.sin(offset) * radius]} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <MeshTransmissionMaterial
        backside
        samples={6}
        thickness={0.3}
        chromaticAberration={0.05}
        anisotropy={0.1}
        distortion={0.05}
        distortionScale={0.1}
        temporalDistortion={0.02}
        color={color}
        transmission={0.95}
        roughness={0.02}
        ior={1.3}
        envMapIntensity={1}
      />
    </mesh>
  );
}

// Orbital ring with full 360 rotation around center point
function OrbitalRing({ radius = 2.5, color = "#10b981", tilt = [0, 0, 0], speed = 0.3, center = [0, 0, 0], children }) {
  const groupRef = useRef();
  const tiltRef = useRef();

  const { geometry, lineGeometry } = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(128);

    const path = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, 0, p.y)),
      true
    );
    const tubeGeometry = new THREE.TubeGeometry(path, 128, 0.008, 8, true);

    const lineGeo = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, 0, p.y))
    );

    return { geometry: tubeGeometry, lineGeometry: lineGeo };
  }, [radius]);

  useFrame(() => {
    if (groupRef.current) {
      // Rotate around the center (Y axis - horizontal orbit)
      groupRef.current.rotation.y += speed * 0.005;
    }
    if (tiltRef.current) {
      // Additional rotation around X axis (vertical wobble)
      tiltRef.current.rotation.x += speed * 0.003;
    }
  });

  return (
    // Position the entire ring system at the center (emerald location)
    <group position={center}>
      {/* Outer rotation group - orbits horizontally around center */}
      <group ref={groupRef}>
        {/* Inner rotation group - adds vertical rotation + initial tilt */}
        <group ref={tiltRef} rotation={tilt}>
          <mesh geometry={geometry}>
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
          <line geometry={lineGeometry}>
            <lineBasicMaterial color={color} transparent opacity={0.25} linewidth={1} />
          </line>
          {/* Child elements orbit with the ring */}
          {children}
        </group>
      </group>
    </group>
  );
}

// Particle stars
function Stars({ count = 80 }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
    }
    return pos;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// Center position (emerald location)
const CENTER = [0.5, 0, 0];

// Ring configuration - crossing pattern
const RING_1 = {
  radius: 3.2,
  color: "#10b981",
  tilt: [Math.PI / 4, 0, 0], // Tilted forward
  speed: 0.4,
};

const RING_2 = {
  radius: 3.5,
  color: "#6ee7b7",
  tilt: [Math.PI / 2.5, Math.PI / 2, 0], // Tilted sideways to cross
  speed: 0.3,
};

// Shared orbit angle controller
function OrbitController({ angleRef, speed = 0.4 }) {
  useFrame(() => {
    angleRef.current += speed * 0.01;
  });
  return null;
}

// Controls whether the Canvas renders frames.
// When visible=false, no invalidate() is called, so the GPU does zero work.
function RenderController({ visible }) {
  const { invalidate } = useThree();

  useFrame(() => {
    if (visible) invalidate();
  });

  return null;
}

// Main scene
function Scene({ onLoaded }) {
  // Shared angle ref for synchronized orbits
  const sharedAngleRef = useRef(0);

  return (
    <>
      <LoadingTracker onLoaded={onLoaded} />

      {/* Shared orbit controller - updates the angle for all elements */}
      <OrbitController angleRef={sharedAngleRef} speed={0.4} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, 5, 5]} intensity={0.6} color="#10b981" />
      <pointLight position={[5, -5, 5]} intensity={0.4} color="#6ee7b7" />

      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Main central crystal - center of gravity */}
      <MainCrystal position={CENTER} scale={1} />

      {/* Ring 1 (green) with orbiting elements - centered on emerald */}
      <OrbitalRing {...RING_1} center={CENTER}>
        {/* Elements at angle 0 and PI (opposite each other on ring 1) */}
        <RingCrystal radius={RING_1.radius} angleRef={sharedAngleRef} offset={0} color="#10b981" scale={0.35} />
        <RingSphere radius={RING_1.radius} angleRef={sharedAngleRef} offset={Math.PI} color="#a5f3fc" scale={0.28} />
      </OrbitalRing>

      {/* Ring 2 (mint) with orbiting elements - centered on emerald */}
      {/* Elements offset by PI from ring 1 elements (opposite ring position) */}
      <OrbitalRing {...RING_2} center={CENTER}>
        <RingCrystal radius={RING_2.radius} angleRef={sharedAngleRef} offset={Math.PI} color="#6ee7b7" scale={0.4} />
        <RingCrystal radius={RING_2.radius} angleRef={sharedAngleRef} offset={0} color="#06b6d4" scale={0.3} />
      </OrbitalRing>

      {/* Stars */}
      <Stars count={80} />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          radius={0.8}
        />
      </EffectComposer>

      <Preload all />
    </>
  );
}

// Exported component
// Uses Intersection Observer to pause rendering when scrolled off-screen,
// eliminating expensive FBO passes from MeshTransmissionMaterial while hidden.
export function HeroScene({ onLoaded }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);

  // Track whether the hero container is in the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{
        contain: "strict",
        willChange: visible ? "transform" : "auto",
        visibility: visible ? "visible" : "hidden",
        // Prevent hit-testing on hidden canvas
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        style={{ background: "transparent" }}
      >
        <RenderController visible={visible} />
        <Scene onLoaded={onLoaded} />
      </Canvas>
    </div>
  );
}
