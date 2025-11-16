"use client";

import { useEffect, useRef } from "react";
import { PhysicsEngine, CollisionObject } from "@/lib/physics";
import { LevelData } from "@/lib/levelGenerator";
import * as THREE from "three";

interface LevelPhysicsProps {
  levelData: LevelData;
  physicsEngine: PhysicsEngine;
}

export default function LevelPhysics({ levelData, physicsEngine }: LevelPhysicsProps) {
  useEffect(() => {
    // Always re-register when levelData changes
    // Clear any existing collision objects
    physicsEngine.clearCollisionObjects();

    // Register first ground segment as the main platform
    // (Physics engine only supports one platform object)
    if (levelData.ground?.segments && levelData.ground.segments.length > 0) {
      const firstSegment = levelData.ground.segments[0];
      const rockTopY = 0.2;
      const platformCollision: CollisionObject = {
        aabb: {
          min: new THREE.Vector3(
            -firstSegment.width / 2,
            rockTopY - firstSegment.rockLayerHeight,
            firstSegment.z - firstSegment.length / 2
          ),
          max: new THREE.Vector3(
            firstSegment.width / 2,
            rockTopY,
            firstSegment.z + firstSegment.length / 2
          ),
        },
        type: "platform",
      };
      physicsEngine.addCollisionObject(platformCollision);
      
      // Register remaining ground segments as static objects
      for (let i = 1; i < levelData.ground.segments.length; i++) {
        const segment = levelData.ground.segments[i];
        const groundCollision: CollisionObject = {
          aabb: {
            min: new THREE.Vector3(
              -segment.width / 2,
              rockTopY - segment.rockLayerHeight,
              segment.z - segment.length / 2
            ),
            max: new THREE.Vector3(
              segment.width / 2,
              rockTopY,
              segment.z + segment.length / 2
            ),
          },
          type: "obstacle",
        };
        physicsEngine.addCollisionObject(groundCollision);
      }
    }

    // Register platforms as static objects (since we already have one platform)
    levelData.platforms.forEach((platform) => {
      const platformCollision: CollisionObject = {
        aabb: {
          min: new THREE.Vector3(
            platform.x - platform.width / 2,
            platform.y,
            platform.z - platform.depth / 2
          ),
          max: new THREE.Vector3(
            platform.x + platform.width / 2,
            platform.y + platform.height,
            platform.z + platform.depth / 2
          ),
        },
        type: "obstacle",
      };
      physicsEngine.addCollisionObject(platformCollision);
    });

    // Register obstacles (pits, walls, etc.)
    levelData.obstacles.forEach((obstacle) => {
      const obstacleCollision: CollisionObject = {
        aabb: {
          min: new THREE.Vector3(
            obstacle.x - obstacle.width / 2,
            obstacle.y,
            obstacle.z - obstacle.depth / 2
          ),
          max: new THREE.Vector3(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height,
            obstacle.z + obstacle.depth / 2
          ),
        },
        type: "obstacle",
      };
      physicsEngine.addCollisionObject(obstacleCollision);
    });

    // Register targets as obstacles (so player can't walk through them)
    levelData.targets.forEach((target) => {
      if (target.shot) return; // Don't register shot targets
      
      const targetSize = target.type === 'lantern' ? { w: 0.4, h: 0.6, d: 0.4 } :
                        target.type === 'idol' ? { w: 0.3, h: 0.6, d: 0.3 } :
                        { w: 0.4, h: 0.4, d: 0.4 }; // crystal_cluster
      
      const targetCollision: CollisionObject = {
        aabb: {
          min: new THREE.Vector3(
            target.x - targetSize.w / 2,
            target.y,
            target.z - targetSize.d / 2
          ),
          max: new THREE.Vector3(
            target.x + targetSize.w / 2,
            target.y + targetSize.h,
            target.z + targetSize.d / 2
          ),
        },
        type: "obstacle",
      };
      physicsEngine.addCollisionObject(targetCollision);
    });

    // Register boss gate as obstacle
    if (!levelData.bossGate.open) {
      const gateCollision: CollisionObject = {
        aabb: {
          min: new THREE.Vector3(
            levelData.bossGate.x - 1.5,
            levelData.bossGate.y - 2,
            levelData.bossGate.z - 0.25
          ),
          max: new THREE.Vector3(
            levelData.bossGate.x + 1.5,
            levelData.bossGate.y + 2,
            levelData.bossGate.z + 0.25
          ),
        },
        type: "obstacle",
      };
      physicsEngine.addCollisionObject(gateCollision);
    }

    // Don't clear on unmount - let PlayerCharacter handle cleanup
  }, [levelData, physicsEngine]);

  return null;
}

