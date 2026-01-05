import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const EARTH_RADIUS = 1;
const ROTATION_SPEED = 0.001;

function Earth() {
  const earthRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const [error, setError] = useState<string | null>(null);

  // Use a single, reliable NASA Blue Marble texture
  const colorMap = useLoader(
    TextureLoader,
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2048&auto=format&fit=crop',
    (loader) => {
      loader.crossOrigin = 'anonymous';
    },
    (error) => {
      console.error('Error loading texture:', error);
      setError('Failed to load Earth texture');
    }
  );

  // Configure texture wrapping and repeat
  if (colorMap) {
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(1, 1);
    colorMap.minFilter = THREE.LinearFilter;
    colorMap.magFilter = THREE.LinearFilter;
    colorMap.encoding = THREE.sRGBEncoding;
  }

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (earthRef.current) {
      earthRef.current.rotation.y = time * ROTATION_SPEED;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = time * ROTATION_SPEED * 0.9;
    }
  });

  if (error) {
    console.error('Globe Error:', error);
    return null;
  }

  return (
    <>
      {/* Uniform lighting setup */}
      <ambientLight intensity={1.5} />
      
      {/* Multiple directional lights for even illumination */}
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <directionalLight position={[-5, 3, -5]} intensity={0.6} />
      <directionalLight position={[5, -3, 5]} intensity={0.6} />
      <directionalLight position={[-5, -3, -5]} intensity={0.6} />
      <directionalLight position={[0, 5, 0]} intensity={0.6} />
      <directionalLight position={[0, -5, 0]} intensity={0.6} />

      <group ref={earthRef}>
        {/* Main Earth sphere */}
        <mesh ref={sphereRef}>
          <sphereGeometry args={[EARTH_RADIUS, 256, 256]} />
          <meshPhongMaterial
            map={colorMap}
            shininess={5}
            specular={new THREE.Color(0x666666)}
          />
        </mesh>

        {/* Atmosphere glow */}
        <mesh ref={atmosphereRef} scale={1.01}>
          <sphereGeometry args={[EARTH_RADIUS, 256, 256]} />
          <meshPhongMaterial
            color="#4a6b8c"
            transparent={true}
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer atmosphere layers */}
        {[1.015, 1.02, 1.025, 1.03].map((scale, i) => (
          <mesh key={`atmosphere-${i}`} scale={scale}>
            <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
            <meshPhongMaterial
              color="#4a6b8c"
              transparent={true}
              opacity={0.06 - (i * 0.01)}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function Globe() {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 3]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={5}
          rotateSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
        <Earth />
      </Canvas>
    </div>
  );
}