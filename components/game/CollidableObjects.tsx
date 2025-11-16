"use client";

import { useEffect, useRef } from "react";
import { CollidableObject } from "@/lib/collisionSystem";
import { LevelData } from "@/lib/levelGenerator";
import * as THREE from "three";

interface CollidableObjectsProps {
  levelData: LevelData;
  onCollidablesReady: (collidables: CollidableObject[]) => void;
}

/**
 * Component that creates THREE.Box3 collision boxes for all level objects
 * Marks all obstacles and platforms as collidable
 */
export default function CollidableObjects({ levelData, onCollidablesReady }: CollidableObjectsProps) {
  const collidablesRef = useRef<CollidableObject[]>([]);

  // GameLevel rotates the entire scene 180° around the Y axis.
  // Apply the same rotation to collision boxes so physics matches visuals.
  const rotateBoxForScene = (box: THREE.Box3) => {
    const rotated = new THREE.Box3();
    rotated.min.set(-box.max.x, box.min.y, -box.max.z);
    rotated.max.set(-box.min.x, box.max.y, -box.min.z);
    return rotated;
  };

  useEffect(() => {
    const collidables: CollidableObject[] = [];

    const shallowPits = levelData.obstacles.filter(
      (obstacle) => obstacle.type === "pit" && obstacle.depth <= 0.2
    );

    const computeSlices = (
      segment: LevelData["ground"]["segments"][number]
    ): Array<{ start: number; end: number }> => {
      const segmentStart = segment.z - segment.length / 2;
      const segmentEnd = segment.z + segment.length / 2;
      let slices = [{ start: segmentStart, end: segmentEnd }];

      shallowPits.forEach((pit) => {
        const pitStart = pit.z - pit.height / 2;
        const pitEnd = pit.z + pit.height / 2;
        if (pitEnd <= segmentStart || pitStart >= segmentEnd) return;

        slices = slices.flatMap((slice) => {
          if (pitEnd <= slice.start || pitStart >= slice.end) return [slice];
          const newSlices = [];
          if (pitStart > slice.start) newSlices.push({ start: slice.start, end: pitStart });
          if (pitEnd < slice.end) newSlices.push({ start: pitEnd, end: slice.end });
          return newSlices.filter((s) => s.end - s.start > 0.1);
        });
      });

      return slices;
    };

    // Register ground segments as platforms (can be stood on)
    if (levelData.ground?.segments) {
      levelData.ground.segments.forEach((segment) => {
        const rockTopY = 0.2;
        const slices = computeSlices(segment);
        slices.forEach((slice) => {
          const sliceLength = slice.end - slice.start;
          const sliceCenterZ = (slice.start + slice.end) / 2;
          const box = new THREE.Box3();
          box.min.set(
            -segment.width / 2,
            rockTopY - segment.rockLayerHeight,
            sliceCenterZ - sliceLength / 2
          );
          box.max.set(
            segment.width / 2,
            rockTopY,
            sliceCenterZ + sliceLength / 2
          );
          
          collidables.push({
            box: rotateBoxForScene(box),
            isPlatform: true, // Can stand on ground
          });
        });
      });
    }

    // Register platforms as platforms (can be stood on)
    levelData.platforms.forEach((platform) => {
      const box = new THREE.Box3();
      box.min.set(
        platform.x - platform.width / 2,
        platform.y, // Bottom of platform
        platform.z - platform.depth / 2
      );
      box.max.set(
        platform.x + platform.width / 2,
        platform.y + platform.height, // Top of platform (where player stands)
        platform.z + platform.depth / 2
      );
      
      collidables.push({
        box: rotateBoxForScene(box),
        isPlatform: true, // Can stand on platforms
      });
    });

    // Register obstacles (skip pits since they represent gaps)
    levelData.obstacles.forEach((obstacle => {
      if (obstacle.type === 'pit') {
        return;
      }
      const box = new THREE.Box3();
      box.min.set(
        obstacle.x - obstacle.width / 2,
        obstacle.y,
        obstacle.z - obstacle.depth / 2
      );
      box.max.set(
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height,
        obstacle.z + obstacle.depth / 2
      );
      
      // Treat non-pit obstacles as platforms so player can stand/jump on them
      const isStandable = obstacle.type !== "pit";
      
      collidables.push({
        box: rotateBoxForScene(box),
        isPlatform: isStandable,
      });
    }));

    // Register targets as solid obstacles
    levelData.targets.forEach((target) => {
      if (target.shot) return; // Don't register shot targets
      
      const targetSize = target.type === 'lantern' ? { w: 0.4, h: 0.6, d: 0.4 } :
                        target.type === 'idol' ? { w: 0.3, h: 0.6, d: 0.3 } :
                        { w: 0.4, h: 0.4, d: 0.4 }; // crystal_cluster
      
      const box = new THREE.Box3();
      box.min.set(
        target.x - targetSize.w / 2,
        target.y,
        target.z - targetSize.d / 2
      );
      box.max.set(
        target.x + targetSize.w / 2,
        target.y + targetSize.h,
        target.z + targetSize.d / 2
      );
      
      collidables.push({
        box: rotateBoxForScene(box),
        isPlatform: false, // Solid obstacle
      });
    });

    // Register boss gate as solid obstacle (when closed)
    if (!levelData.bossGate.open) {
      const box = new THREE.Box3();
      box.min.set(
        levelData.bossGate.x - 1.5,
        levelData.bossGate.y - 2,
        levelData.bossGate.z - 0.25
      );
      box.max.set(
        levelData.bossGate.x + 1.5,
        levelData.bossGate.y + 2,
        levelData.bossGate.z + 0.25
      );
      
      collidables.push({
        box: rotateBoxForScene(box),
        isPlatform: false, // Solid obstacle
      });
    }

    collidablesRef.current = collidables;
    onCollidablesReady(collidables);
  }, [levelData, onCollidablesReady]);

  return null;
}

