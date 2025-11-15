"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IMUData } from "@/lib/types";
import { ShakeDetector } from "@/lib/shakeDetection";

interface PlayerCharacterProps {
  poseState: "standing" | "jumping" | "unknown";
  imuData?: IMUData | null;
  onPositionChange?: (z: number) => void;
}

export default function PlayerCharacter({ poseState, imuData, onPositionChange }: PlayerCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const jumpAnimationRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  
  // Movement velocity (for smooth movement)
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  
  // Shake detector for controller movement
  const shakeDetectorRef = useMemo(() => new ShakeDetector(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Handle jumping animation
    if (poseState === "jumping" && !isJumpingRef.current) {
      // Start jump
      isJumpingRef.current = true;
      jumpAnimationRef.current = 0;
    } else if (poseState === "standing" && isJumpingRef.current) {
      // Land from jump - smoothly return to platform
      const platformTop = 0.2; // Character's base position on platform
      if (groupRef.current.position.y > platformTop + 0.01) {
        groupRef.current.position.y = Math.max(platformTop, groupRef.current.position.y - delta * 3);
      } else {
        isJumpingRef.current = false;
        jumpAnimationRef.current = 0;
        groupRef.current.position.y = platformTop;
      }
    }

    // Animate jump with smooth arc
    if (isJumpingRef.current && poseState === "jumping") {
      jumpAnimationRef.current += delta * 4; // Jump speed
      // Use a parabolic arc for realistic jump
      const progress = Math.min(jumpAnimationRef.current, Math.PI); // Half cycle (up then down)
      const jumpHeight = Math.sin(progress) * 0.8; // Jump height
      groupRef.current.position.y = 0.2 + jumpHeight; // Base position (0.2) + jump height
    } else if (!isJumpingRef.current) {
      // Ensure character is on platform when standing
      groupRef.current.position.y = 0.2;
    }

    // Handle IMU-based movement with shake detection
    if (imuData) {
      // Calculate horizontal acceleration magnitude for logging (filtering gravity)
      const zFiltered = Math.abs(imuData.accel_g[2] - 1.0); // Remove gravity component from Z
      const horizontalMagnitude = Math.sqrt(imuData.accel_g[0] ** 2 + zFiltered ** 2);
      const isStill = shakeDetectorRef.isStill(imuData);
      
      // Detect if controller is being shaken
      const isShaking = shakeDetectorRef.detectShake(imuData);
      
      // Constant forward speed (units per second)
      const CONSTANT_SPEED = 5.0; // Adjust this value to change movement speed
      
      // Only allow forward movement when shaking is detected
      // Character can only move forward or stay still
      if (isShaking) {
        // Use constant speed instead of variable acceleration-based speed
        const targetVelocity = CONSTANT_SPEED;
        
        // Smoothly transition to target velocity
        const smoothing = 0.9;
        velocityRef.current.z = velocityRef.current.z * smoothing + targetVelocity * (1 - smoothing);
        
        // Update character position (only forward, no sideways movement)
        // Negative Z to move in opposite direction
        groupRef.current.position.z -= velocityRef.current.z * delta;
      } else {
        // Not shaking - gradually slow down to stop
        const deceleration = 0.85; // Deceleration factor
        velocityRef.current.z *= deceleration;
        
        // Stop if velocity is very small
        if (Math.abs(velocityRef.current.z) < 0.05) {
          velocityRef.current.z = 0;
        }
        
        // Apply remaining velocity (negative Z to move in opposite direction)
        groupRef.current.position.z -= velocityRef.current.z * delta;
      }
      
      // Keep character within platform bounds (platform width is 4, so ±2)
      // Center the character on the platform
      const platformWidth = 4;
      groupRef.current.position.x = 0; // Always centered, no sideways movement
      
      // Notify parent of position change for camera following
      if (onPositionChange) {
        onPositionChange(groupRef.current.position.z);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]} rotation={[0, Math.PI, 0]}>
      {/* Head - pixelated blocky style (grey/white - no color) */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#CCCCCC" flatShading roughness={0.8} />
      </mesh>

      {/* Body/Torso (darker grey) */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.4]} />
        <meshStandardMaterial color="#888888" flatShading roughness={0.8} />
      </mesh>

      {/* Left Arm (medium grey) */}
      <mesh position={[-0.4, 0.7, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#AAAAAA" flatShading roughness={0.8} />
      </mesh>

      {/* Right Arm (medium grey) */}
      <mesh position={[0.4, 0.7, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#AAAAAA" flatShading roughness={0.8} />
      </mesh>

      {/* Left Leg (dark grey) - bottom of leg at y = 0 relative to group */}
      <mesh position={[-0.15, 0, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#666666" flatShading roughness={0.8} />
      </mesh>

      {/* Right Leg (dark grey) - bottom of leg at y = 0 relative to group */}
      <mesh position={[0.15, 0, 0]}>
        <boxGeometry args={[0.25, 0.8, 0.25]} />
        <meshStandardMaterial color="#666666" flatShading roughness={0.8} />
      </mesh>
    </group>
  );
}

