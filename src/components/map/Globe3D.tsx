'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useZenithStore } from '@/hooks/useZenithStore';

const EARTH_RADIUS = 2;

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 90) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Earth() {
  const [dayMap, normalMap, specularMap, nightMap] = useLoader(THREE.TextureLoader, [
    '/textures/earth_daymap.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_nightlights.png',
  ]);

  // Configure texture settings for quality
  useMemo(() => {
    [dayMap, normalMap, specularMap, nightMap].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    });
    // Normal and specular maps should use linear color space
    normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    specularMap.colorSpace = THREE.LinearSRGBColorSpace;
  }, [dayMap, normalMap, specularMap, nightMap]);


  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshPhongMaterial
        map={dayMap}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.85, 0.85)}
        specularMap={specularMap}
        specular={new THREE.Color('#666666')}
        shininess={25}
        emissiveMap={nightMap}
        emissive={new THREE.Color('#FFDDAA')}
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

function Clouds() {
  const cloudsRef = useRef<THREE.Mesh>(null);

  const cloudMap = useLoader(THREE.TextureLoader, '/textures/earth_clouds.png');

  useMemo(() => {
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.anisotropy = 8;
  }, [cloudMap]);

  useFrame((_, delta) => {
    // Very subtle cloud drift relative to the Earth surface
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.005;
  });

  return (
    <mesh ref={cloudsRef}>
      <sphereGeometry args={[EARTH_RADIUS * 1.005, 64, 64]} />
      <meshPhongMaterial
        map={cloudMap}
        transparent
        opacity={0.35}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function AtmosphereGlow() {
  return (
    <>
      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.015, 64, 64]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      {/* Outer atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.08, 64, 64]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {/* Far atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.15, 64, 64]} />
        <meshBasicMaterial color="#1A7EC8" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
    </>
  );
}

function ZenithMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = useMemo(() => latLngToVec3(lat, lng, EARTH_RADIUS * 1.02), [lat, lng]);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#4FC3F7" />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.05, 0.07, 24]} />
        <meshBasicMaterial color="#4FC3F7" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Vertical beam shooting outward (zenith direction) */}
      <Line
        points={[[0, 0, 0], pos.clone().normalize().multiplyScalar(0.5)]}
        color="#4FC3F7"
        transparent
        opacity={0.4}
        lineWidth={1}
      />
    </group>
  );
}

function ISSMarker({ lat, lng }: { lat: number; lng: number }) {
  const pos = useMemo(() => latLngToVec3(lat, lng, EARTH_RADIUS * 1.18), [lat, lng]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
      <pointLight color="#F59E0B" intensity={0.5} distance={1} />
    </group>
  );
}


function ConnectionArc({ lat, lng }: { lat: number; lng: number }) {
  const { issPosition } = useZenithStore();
  if (!issPosition) return null;

  const start = latLngToVec3(lat, lng, EARTH_RADIUS * 1.02);
  const end = latLngToVec3(issPosition.latitude, issPosition.longitude, EARTH_RADIUS * 1.18);
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS * 1.4);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(32).map((p): [number, number, number] => [p.x, p.y, p.z]);

  return <Line points={points} color="#A78BFA" transparent opacity={0.3} lineWidth={1} dashed dashSize={0.05} gapSize={0.03} />;
}

function ISSOrbitPath() {
  const { issTLE } = useZenithStore();
  
  const orbitPoints = useMemo(() => {
    if (!issTLE) return [];
    try {
      const satrec = satellite.twoline2satrec(issTLE.line1, issTLE.line2);
      const points: [number, number, number][] = [];
      const now = new Date();
      
      // Calculate one full orbit (roughly 90-95 minutes) at 1-minute intervals
      for (let i = 0; i <= 95; i++) {
        const time = new Date(now.getTime() + i * 60000);
        const positionAndVelocity = satellite.propagate(satrec, time);
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
          
          const lat = satellite.degreesLat(positionGd.latitude);
          const lng = satellite.degreesLong(positionGd.longitude);
          const alt = positionGd.height;
          
          // Use the exact same coordinate mapping function for accurate 3D placement
          // Convert altitude to our scaled earth radius model roughly
          const radiusScale = EARTH_RADIUS * (1 + (alt / 6371));
          const p = latLngToVec3(lat, lng, radiusScale);
          points.push([p.x, p.y, p.z]);
        }
      }
      return points;
    } catch (e) {
      console.warn('[ISS Orbit]', e);
      return [];
    }
  }, [issTLE]);

  console.log('[ISSOrbitPath] issTLE:', issTLE ? 'present' : 'null', 'orbitPoints:', orbitPoints.length);

  if (orbitPoints.length < 2) return null;

  return (
    <Line 
      points={orbitPoints} 
      color="#F59E0B" 
      transparent 
      opacity={0.8} 
      lineWidth={2} 
    />
  );
}

function Scene() {
  const { coordinates, issPosition } = useZenithStore();

  return (
    <>
      {/* Sunlight - directional from one side to create day/night effect */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={2.0} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.15} color="#4FC3F7" />

      <group rotation={[0, -Math.PI / 2, 0]}>
        <Earth />
        <Clouds />
        <AtmosphereGlow />
      </group>

      <ISSOrbitPath />
      {coordinates && <ZenithMarker lat={coordinates.lat} lng={coordinates.lng} />}
      {issPosition && <ISSMarker lat={issPosition.latitude} lng={issPosition.longitude} />}
      {coordinates && issPosition && <ConnectionArc lat={coordinates.lat} lng={coordinates.lng} />}

      <Stars radius={50} depth={50} count={2000} factor={2} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        minDistance={3.5}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function Globe3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 1, 6], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-2 left-2 font-mono text-[9px] text-starlight/30 pointer-events-none">
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>
    </div>
  );
}
