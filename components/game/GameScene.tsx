"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import CaveTerrain from "./CaveTerrain";
import PlayerCharacter from "./PlayerCharacter";
import * as THREE from "three";

import { IMUData } from "@/lib/types";

interface GameSceneProps {
  poseState: "standing" | "jumping" | "unknown";
  imuData?: IMUData | null;
}

// Component to set camera to look at character from the side and follow it
function CameraController({ characterZ }: { characterZ: number }) {
  const { camera } = useThree();
  
  useEffect(() => {
    // Position camera to the right side, following character's Z position
    camera.position.set(6, 1.5, characterZ);
    // Make camera look at the character (at character's Z position, slightly elevated)
    camera.lookAt(0, 1, characterZ);
    camera.updateProjectionMatrix();
  }, [camera, characterZ]);

  return null;
}

export default function GameScene({ poseState, imuData }: GameSceneProps) {
  const [characterZ, setCharacterZ] = useState(0);

  return (
    <Canvas
      camera={{ 
        position: [6, 1.5, 0], // Side view - camera to the right, looking at character profile
        fov: 60
      }}
      gl={{ 
        antialias: false, // Pixelated look
        powerPreference: "high-performance"
      }}
      style={{ width: "100%", height: "100%", background: "#0a0a0a" }}
    >
      <CameraController characterZ={characterZ} />
      
      {/* Lighting - dim cave lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[0, 5, 5]} intensity={0.5} />
      <pointLight position={[0, 3, 0]} intensity={0.2} color="#ffffff" />

      {/* Scene */}
      <CaveTerrain />
      <PlayerCharacter poseState={poseState} imuData={imuData} onPositionChange={setCharacterZ} />
    </Canvas>
  );
}

