// Collision detection and resolution using THREE.Box3
import * as THREE from "three";

// Constants
export const GRAVITY = -15.0; // Units per second squared (negative = downward)
export const JUMP_SPEED = 6.0; // Initial upward velocity when jumping (higher jump)
export const GROUND_CHECK_DISTANCE = 0.1; // How close to platform to be considered grounded

// Collision object interface
export interface CollidableObject {
  box: THREE.Box3;
  isPlatform: boolean; // true if player can stand on top, false if solid obstacle
  mesh?: THREE.Mesh; // Optional reference to the mesh
}

// Collision result
export interface CollisionResult {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isGrounded: boolean;
  groundedOn?: CollidableObject; // Which platform/ground the player is standing on
}

/**
 * Check if player is grounded (standing on a platform or ground)
 * Player is grounded if their bottom is very close to a platform's top
 */
export function checkGrounded(
  playerBox: THREE.Box3,
  collidables: CollidableObject[]
): { isGrounded: boolean; groundedOn?: CollidableObject } {
  const playerBottom = playerBox.min.y;
  
  for (const obj of collidables) {
    if (!obj.isPlatform) continue; // Only platforms can be stood on
    
    const platformTop = obj.box.max.y;
    const isWithinXZ = (
      playerBox.max.x > obj.box.min.x &&
      playerBox.min.x < obj.box.max.x &&
      playerBox.max.z > obj.box.min.z &&
      playerBox.min.z < obj.box.max.z
    );
    
    // Check if player bottom is very close to platform top (within GROUND_CHECK_DISTANCE)
    if (isWithinXZ && Math.abs(playerBottom - platformTop) < GROUND_CHECK_DISTANCE) {
      return { isGrounded: true, groundedOn: obj };
    }
  }
  
  return { isGrounded: false };
}

/**
 * Resolve vertical collision (landing on platform or hitting ceiling)
 * Returns new Y position and updated velocity
 */
export function resolveVerticalCollision(
  playerBox: THREE.Box3,
  playerVelocity: THREE.Vector3,
  playerSize: THREE.Vector3,
  collidables: CollidableObject[]
): { y: number; velocityY: number; isGrounded: boolean; groundedOn?: CollidableObject } {
  const playerBottom = playerBox.min.y;
  const playerTop = playerBox.max.y;
  let resolvedY = playerBox.min.y;
  let resolvedVelocityY = playerVelocity.y;
  let isGrounded = false;
  let groundedOn: CollidableObject | undefined;
  const playerHeight = playerSize.y;
  
  for (const obj of collidables) {
    if (!playerBox.intersectsBox(obj.box)) continue;
    
    const objTop = obj.box.max.y;
    const objBottom = obj.box.min.y;
    const isWithinXZ = (
      playerBox.max.x > obj.box.min.x &&
      playerBox.min.x < obj.box.max.x &&
      playerBox.max.z > obj.box.min.z &&
      playerBox.min.z < obj.box.max.z
    );
    
    if (!isWithinXZ) continue;
    
    // Landing on platform from above or standing on platform
    if (obj.isPlatform && playerBottom <= objTop + 0.3 && playerBottom >= objTop - 0.5) {
      // Snap player to platform top
      resolvedY = objTop;
      resolvedVelocityY = 0; // Stop vertical velocity when landing/standing
      isGrounded = true;
      groundedOn = obj;
      break; // Only land on one platform at a time
    }
    
    // Hitting ceiling or solid object from below
    if (playerTop > objBottom - 0.1 && playerTop < objBottom + 0.3) {
      // Push player down
      resolvedY = objBottom - playerHeight;
      resolvedVelocityY = Math.min(0, resolvedVelocityY); // Stop upward velocity
    }
    
    // Inside solid object - push up or down based on which is closer
    // But prioritize platforms - if it's a platform and player is near the top, stand on it
    if (playerBottom < objTop && playerTop > objBottom) {
      if (obj.isPlatform && playerBottom <= objTop + 0.3) {
        // Player is on or near platform top - stand on it
        resolvedY = objTop;
        resolvedVelocityY = 0;
        isGrounded = true;
        groundedOn = obj;
      } else {
        // Not a platform or not near top - push based on distance
        const distToTop = Math.abs(playerTop - objTop);
        const distToBottom = Math.abs(playerBottom - objBottom);
        
        if (distToTop < distToBottom) {
          // Push up
          resolvedY = objTop;
          resolvedVelocityY = 0;
          if (obj.isPlatform) {
            isGrounded = true;
            groundedOn = obj;
          }
        } else {
          // Push down
          resolvedY = objBottom - playerHeight;
          resolvedVelocityY = Math.min(0, resolvedVelocityY);
        }
      }
    }
  }
  
  return { y: resolvedY, velocityY: resolvedVelocityY, isGrounded, groundedOn };
}

/**
 * Resolve horizontal collision (hitting walls, obstacles from the side)
 * Returns new X and Z positions
 * IMPORTANT: Uses the already-resolved playerBox from vertical collision to preserve Y position
 */
export function resolveHorizontalCollision(
  playerBox: THREE.Box3, // Already has resolved Y from vertical collision
  desiredPosition: THREE.Vector3, // Position with resolved Y
  playerSize: THREE.Vector3,
  playerCenterOffset: THREE.Vector3,
  collidables: CollidableObject[]
): { x: number; z: number } {
  let resolvedX = desiredPosition.x;
  let resolvedZ = desiredPosition.z;
  
  // Use the playerBox that already has the resolved Y position
  // We'll update X and Z but keep Y from the resolved playerBox
  const testBox = playerBox.clone();
  
  // Update test box X and Z to desired position (Y is already correct from vertical resolution)
  const playerCenter = desiredPosition.clone().add(playerCenterOffset);
  const halfSize = playerSize.clone().multiplyScalar(0.5);
  testBox.min.x = playerCenter.x - halfSize.x;
  testBox.max.x = playerCenter.x + halfSize.x;
  testBox.min.z = playerCenter.z - halfSize.z;
  testBox.max.z = playerCenter.z + halfSize.z;
  // Y is already set correctly from vertical resolution, don't change it
  
  for (const obj of collidables) {
    if (!testBox.intersectsBox(obj.box)) continue;
    
    // Check if collision is primarily horizontal (not vertical landing)
    const verticalOverlap = Math.min(testBox.max.y, obj.box.max.y) - Math.max(testBox.min.y, obj.box.min.y);
    const horizontalOverlap = Math.min(testBox.max.x, obj.box.max.x) - Math.max(testBox.min.x, obj.box.min.x);
    const depthOverlap = Math.min(testBox.max.z, obj.box.max.z) - Math.max(testBox.min.z, obj.box.min.z);
    
    // If vertical overlap is small, this is a horizontal collision
    // Also skip if this is a platform and player is landing on it (handled by vertical resolution)
    const isLandingOnPlatform = obj.isPlatform && testBox.min.y <= obj.box.max.y + 0.2 && testBox.min.y >= obj.box.max.y - 0.5;
    
    if (!isLandingOnPlatform && verticalOverlap < playerSize.y * 0.5) {
      // Resolve X collision
      if (horizontalOverlap > 0) {
        const playerCenterX = (testBox.min.x + testBox.max.x) * 0.5;
        const objCenterX = (obj.box.min.x + obj.box.max.x) * 0.5;
        const playerWidth = playerSize.x;
        
        if (playerCenterX < objCenterX) {
          // Player is to the left, push left
          resolvedX = obj.box.min.x - playerWidth * 0.5;
        } else {
          // Player is to the right, push right
          resolvedX = obj.box.max.x + playerWidth * 0.5;
        }
        
        // Recalculate test box X for Z resolution (preserve Y and Z for now)
        testBox.min.x = resolvedX - halfSize.x;
        testBox.max.x = resolvedX + halfSize.x;
      }
      
      // Resolve Z collision
      if (depthOverlap > 0 && testBox.intersectsBox(obj.box)) {
        const playerCenterZ = (testBox.min.z + testBox.max.z) * 0.5;
        const objCenterZ = (obj.box.min.z + obj.box.max.z) * 0.5;
        const playerDepth = playerSize.z;
        
        if (playerCenterZ < objCenterZ) {
          // Player is behind, push back
          resolvedZ = obj.box.min.z - playerDepth * 0.5;
        } else {
          // Player is in front, push forward
          resolvedZ = obj.box.max.z + playerDepth * 0.5;
        }
      }
    }
  }
  
  return { x: resolvedX, z: resolvedZ };
}

/**
 * Main collision resolution function
 * Handles all collision types and returns final position, velocity, and grounded state
 */
export function resolveCollisions(
  desiredPosition: THREE.Vector3,
  velocity: THREE.Vector3,
  playerSize: THREE.Vector3,
  playerCenterOffset: THREE.Vector3,
  collidables: CollidableObject[]
): CollisionResult {
  // Create player bounding box at desired position
  const playerCenter = desiredPosition.clone().add(playerCenterOffset);
  const halfSize = playerSize.clone().multiplyScalar(0.5);
  const playerBox = new THREE.Box3();
  playerBox.min.copy(playerCenter).sub(halfSize);
  playerBox.max.copy(playerCenter).add(halfSize);
  
  // First, resolve vertical collisions (landing on platforms, hitting ceilings)
  const verticalResult = resolveVerticalCollision(playerBox, velocity, playerSize, collidables);
  
  // Update player box with resolved Y (verticalResult.y is the bottom of the player box)
  playerBox.min.y = verticalResult.y;
  playerBox.max.y = verticalResult.y + playerSize.y;
  
  // Convert resolved Y (player box bottom) back to group position
  // Group position = player box bottom - characterCenterOffset.y + halfSize.y
  // But we need: group.y + characterCenterOffset.y - halfSize.y = resolvedY
  // So: group.y = resolvedY - characterCenterOffset.y + halfSize.y
  const positionWithY = desiredPosition.clone();
  positionWithY.y = verticalResult.y - playerCenterOffset.y + halfSize.y;
  
  // Then, resolve horizontal collisions (hitting walls, obstacles)
  const horizontalResult = resolveHorizontalCollision(playerBox, positionWithY, playerSize, playerCenterOffset, collidables);
  
  // Final position
  const finalPosition = new THREE.Vector3(
    horizontalResult.x,
    positionWithY.y,
    horizontalResult.z
  );
  
  // After horizontal movement, verify player is still on platform
  // Rebuild player box at final position to check grounded state
  const finalPlayerCenter = finalPosition.clone().add(playerCenterOffset);
  const finalPlayerBox = new THREE.Box3();
  finalPlayerBox.min.copy(finalPlayerCenter).sub(halfSize);
  finalPlayerBox.max.copy(finalPlayerCenter).add(halfSize);
  
  // Check if player is still grounded after horizontal movement
  let finalIsGrounded = verticalResult.isGrounded;
  let finalGroundedOn = verticalResult.groundedOn;
  
  if (verticalResult.isGrounded) {
    // Verify player is still on the same platform after horizontal movement
    const playerBottom = finalPlayerBox.min.y;
    let stillOnPlatform = false;
    
    for (const obj of collidables) {
      if (!obj.isPlatform) continue;
      
      const objTop = obj.box.max.y;
      const isWithinXZ = (
        finalPlayerBox.max.x > obj.box.min.x &&
        finalPlayerBox.min.x < obj.box.max.x &&
        finalPlayerBox.max.z > obj.box.min.z &&
        finalPlayerBox.min.z < obj.box.max.z
      );
      
      if (isWithinXZ && Math.abs(playerBottom - objTop) < GROUND_CHECK_DISTANCE) {
        // Player is on this platform
        stillOnPlatform = true;
        finalGroundedOn = obj;
        // Ensure player is exactly on platform top
        finalPosition.y = objTop - playerCenterOffset.y + halfSize.y;
        break;
      }
    }
    
    if (!stillOnPlatform) {
      // Player moved off platform - they're falling
      finalIsGrounded = false;
      finalGroundedOn = undefined;
    }
  } else {
    // Player wasn't grounded, check if they landed on a platform after horizontal movement
    const groundedCheck = checkGrounded(finalPlayerBox, collidables);
    if (groundedCheck.isGrounded) {
      finalIsGrounded = true;
      finalGroundedOn = groundedCheck.groundedOn;
      // Snap to platform top
      if (finalGroundedOn) {
        const playerBottom = finalPlayerBox.min.y;
        const platformTop = finalGroundedOn.box.max.y;
        finalPosition.y = platformTop - playerCenterOffset.y + halfSize.y;
      }
    }
  }
  
  // Final velocity (Y is updated from vertical resolution)
  const finalVelocity = velocity.clone();
  finalVelocity.y = verticalResult.velocityY;
  
  // If grounded, ensure vertical velocity is 0 (unless jumping)
  if (finalIsGrounded && finalVelocity.y < 0) {
    finalVelocity.y = 0;
  }
  
  return {
    position: finalPosition,
    velocity: finalVelocity,
    isGrounded: finalIsGrounded,
    groundedOn: finalGroundedOn
  };
}

