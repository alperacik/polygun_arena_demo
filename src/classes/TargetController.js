/**
 * @fileoverview TargetController class managing target creation, positioning, and elimination animations.
 * Handles various target layouts, movement patterns, and hit detection responses.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import {
  PLAY_AGAIN_EVENT_NAME,
  TARGET_CONFIG_CHANGED_EVENT_NAME,
} from '../helpers/EventNames';
import { ANIMATION_CONFIG, CURRENT_TARGET_CONFIG } from '../helpers/constants';

/**
 * TargetController class managing target objects and their behaviors
 * Handles target creation, positioning, animations, and elimination
 */
export class TargetController {
  /**
   * Creates a new TargetController instance with scene and configuration
   * @param {THREE.Scene} scene - The main game scene
   * @param {THREE.Group} targetObj - Target 3D model object
   * @param {number} count - Number of targets to create
   * @param {EventBus} eventBus - Event bus for game communication
   * @param {Object} [config=CURRENT_TARGET_CONFIG] - Target configuration object
   * @param {THREE.Texture} [texture] - Texture to apply to targets
   * @constructor
   */
  constructor(
    scene,
    targetObj,
    count,
    eventBus,
    config = CURRENT_TARGET_CONFIG,
    texture = null
  ) {
    /** @type {THREE.Scene} Main game scene */
    this.scene = scene;
    /** @type {EventBus} Event bus for game communication */
    this.eventBus = eventBus;
    /** @type {THREE.Group} Target 3D model object */
    this.targetObj = targetObj;
    /** @type {number} Number of targets to create */
    this.count = count;
    /** @type {Object} Target configuration object */
    this.config = config;
    /** @type {THREE.Texture|null} Texture to apply to targets */
    this.texture = texture;

    /** @type {Array<THREE.Group>} Array of target objects */
    this.targets = [];
    /** @type {Map<THREE.Group, Object>} Map tracking animation state for each target */
    this.targetAnimations = new Map();
    /** @type {Map<THREE.Group, Object>} Map tracking movement state for moving targets */
    this.targetMovements = new Map();

    // Apply texture to the original target object if texture is provided
    if (this.texture) {
      this.applyTextureToTarget(this.targetObj);
    }

    this.setupTargets();
    this.setupEventListeners();
  }

  /**
   * Applies texture to all materials in a target object
   * @param {THREE.Group} target - The target object to apply texture to
   */
  applyTextureToTarget(target) {
    target.traverse((child) => {
      if (child.isMesh && child.material) {
        // Handle both single material and material array
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if (material) {
              material.map = this.texture;
              material.needsUpdate = true;
            }
          });
        } else {
          child.material.map = this.texture;
          child.material.needsUpdate = true;
        }
      }
    });
  }

  /**
   * Sets up all targets with their initial positions and states
   * Creates targets, initializes animations, and sets up movement for moving targets
   */
  setupTargets() {
    const positions = this.calculateTargetPositions();

    positions.forEach((position) => {
      const target = this.createTarget(position);
      this.scene.add(target);
      this.targets.push(target);

      // Initialize animation state for this target
      this.targetAnimations.set(target, {
        isAnimating: false,
        startRotation: target.rotation.clone(),
        animationProgress: 0,
        animationDuration: ANIMATION_CONFIG.TARGET_ELIMINATION.DURATION,
        targetRotation: new THREE.Euler(
          ANIMATION_CONFIG.TARGET_ELIMINATION.ROTATION_X,
          0,
          0
        ),
      });

      // Initialize movement state for moving targets
      if (this.config.layout === 'moving' && this.config.movement?.enabled) {
        this.targetMovements.set(target, {
          startPosition: position.clone(),
          time: 0,
          amplitude: this.config.movement.amplitude,
          speed: this.config.movement.speed,
          axis: this.config.movement.axis,
        });
      }
    });
  }

  /**
   * Calculates target positions based on the current layout configuration
   * @returns {Array<THREE.Vector3>} Array of target positions
   */
  calculateTargetPositions() {
    switch (this.config.layout) {
      case 'linear':
        return this.calculateLinearPositions();
      case 'circular':
        return this.calculateCircularPositions();
      case 'grid':
        return this.calculateGridPositions();
      case 'v_formation':
        return this.calculateVFormationPositions();
      case 'scattered':
        return this.calculateScatteredPositions();
      case 'pyramid':
        return this.calculatePyramidPositions();
      case 'moving':
        return this.calculateLinearPositions(); // Base positions for moving targets
      default:
        return this.calculateLinearPositions();
    }
  }

  /**
   * Calculates linear arrangement positions for targets
   * @returns {Array<THREE.Vector3>} Array of linear target positions
   */
  calculateLinearPositions() {
    const positions = [];
    const basePos = new THREE.Vector3(
      this.config.basePosition.x,
      this.config.basePosition.y,
      this.config.basePosition.z
    );

    for (let i = 0; i < this.config.count; i++) {
      const position = basePos
        .clone()
        .add(new THREE.Vector3(i * this.config.spacing, 0, 0));
      positions.push(position);
    }
    return positions;
  }

  /**
   * Calculates circular arrangement positions for targets
   * @returns {Array<THREE.Vector3>} Array of circular target positions
   */
  calculateCircularPositions() {
    const positions = [];
    const center = new THREE.Vector3(
      this.config.centerPosition.x,
      this.config.centerPosition.y,
      this.config.centerPosition.z
    );
    const angleStep = (2 * Math.PI) / this.config.count;

    for (let i = 0; i < this.config.count; i++) {
      const angle = this.config.startAngle + i * angleStep;
      const x = center.x + this.config.radius * Math.cos(angle);
      const z = center.z + this.config.radius * Math.sin(angle);
      positions.push(new THREE.Vector3(x, center.y, z));
    }
    return positions;
  }

  /**
   * Calculates grid arrangement positions for targets
   * @returns {Array<THREE.Vector3>} Array of grid target positions
   */
  calculateGridPositions() {
    const positions = [];
    const basePos = new THREE.Vector3(
      this.config.basePosition.x,
      this.config.basePosition.y,
      this.config.basePosition.z
    );

    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const position = basePos
          .clone()
          .add(
            new THREE.Vector3(
              col * this.config.spacing.x,
              0,
              row * this.config.spacing.z
            )
          );
        positions.push(position);
      }
    }
    return positions;
  }

  /**
   * Calculates V-formation arrangement positions for targets
   * @returns {Array<THREE.Vector3>} Array of V-formation target positions
   */
  calculateVFormationPositions() {
    const positions = [];
    const basePos = new THREE.Vector3(
      this.config.basePosition.x,
      this.config.basePosition.y,
      this.config.basePosition.z
    );

    // Center target
    positions.push(basePos.clone());

    // Left wing
    for (let i = 1; i <= Math.floor(this.config.count / 2); i++) {
      const angle = this.config.angle;
      const distance = i * this.config.spacing;
      const x = basePos.x - distance * Math.cos(angle);
      const z = basePos.z - distance * Math.sin(angle);
      positions.push(new THREE.Vector3(x, basePos.y, z));
    }

    // Right wing
    for (let i = 1; i <= Math.floor((this.config.count - 1) / 2); i++) {
      const angle = this.config.angle;
      const distance = i * this.config.spacing;
      const x = basePos.x + distance * Math.cos(angle);
      const z = basePos.z - distance * Math.sin(angle);
      positions.push(new THREE.Vector3(x, basePos.y, z));
    }

    return positions.slice(0, this.config.count);
  }

  /**
   * Calculates pyramid arrangement positions for targets
   * @returns {Array<THREE.Vector3>} Array of pyramid target positions
   */
  calculatePyramidPositions() {
    const positions = [];
    const basePos = new THREE.Vector3(
      this.config.basePosition.x,
      this.config.basePosition.y,
      this.config.basePosition.z
    );

    for (let row = 0; row < this.config.rows; row++) {
      const targetsInRow = this.config.baseCount - row;
      const startX =
        basePos.x - ((targetsInRow - 1) * this.config.spacing.x) / 2;

      for (let col = 0; col < targetsInRow; col++) {
        const position = basePos
          .clone()
          .add(
            new THREE.Vector3(
              startX + col * this.config.spacing.x,
              0,
              row * this.config.spacing.z
            )
          );
        positions.push(position);
      }
    }
    return positions;
  }

  /**
   * Checks if a new position is too close to existing positions
   * @param {THREE.Vector3} newPos - New position to check
   * @param {Array<THREE.Vector3>} existingPositions - Array of existing positions
   * @param {number} minDistance - Minimum distance required between positions
   * @returns {boolean} True if position is too close to existing positions
   */
  isTooCloseToExisting(newPos, existingPositions, minDistance) {
    return existingPositions.some(
      (pos) => newPos.distanceTo(pos) < minDistance
    );
  }

  /**
   * Creates a target object at the specified position with texture applied
   * @param {THREE.Vector3} position - Position to place the target
   * @returns {THREE.Group} The created target object
   */
  createTarget(position) {
    const target = SkeletonUtils.clone(this.targetObj);
    target.userData.hp = this.config.hp;
    target.position.copy(position);
    target.scale.setScalar(this.config.scale);

    return target;
  }

  /**
   * Sets up event listeners for target-related events
   */
  setupEventListeners() {
    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.resetTargets();
    });
  }

  /**
   * Resets all targets to their initial state
   * Restores visibility, health, and resets animations and movements
   */
  resetTargets() {
    this.targets.forEach((target) => {
      target.visible = true;
      target.userData.hp = this.config.hp;
      target.userData.eliminated = false;
      // Reset animation state
      const animState = this.targetAnimations.get(target);
      if (animState) {
        animState.isAnimating = false;
        animState.animationProgress = 0;
        target.rotation.copy(animState.startRotation);
      }

      // Reset movement state
      const moveState = this.targetMovements.get(target);
      if (moveState) {
        moveState.time = 0;
        target.position.copy(moveState.startPosition);
      }
    });
  }

  /**
   * Gets all target objects
   * @returns {Array<THREE.Group>} Array of all target objects
   */
  getTargets() {
    return this.targets;
  }

  /**
   * Gets the total target count based on the current layout configuration
   * @returns {number} Total number of targets for the current layout
   */
  getTargetCount() {
    // Calculate actual target count based on layout
    switch (this.config.layout) {
      case 'grid':
        return this.config.rows * this.config.cols;
      case 'pyramid': {
        let pyramidCount = 0;
        for (let row = 0; row < this.config.rows; row++) {
          pyramidCount += this.config.baseCount - row;
        }
        return pyramidCount;
      }
      default:
        return this.config.count;
    }
  }

  /**
   * Gets the current number of target objects
   * @returns {number} Current number of target objects
   */
  getCurrentTargetCount() {
    return this.targets.length;
  }

  /**
   * Handles a hit on a target, reducing health and triggering elimination
   * @param {THREE.Group} target - The target that was hit
   * @returns {boolean} True if target was eliminated, false otherwise
   */
  onHit(target) {
    let hp = target.userData.hp;
    if (hp < 1) return false;

    hp--;
    target.userData.hp = hp;

    if (hp < 1) {
      // Mark as eliminated immediately
      target.userData.eliminated = true;
      // Start rotation animation instead of just hiding
      this.startTargetEliminationAnimation(target);
      return true; // Target was eliminated
    }

    return false;
  }

  /**
   * Starts the elimination animation for a target
   * @param {THREE.Group} target - The target to animate
   */
  startTargetEliminationAnimation(target) {
    const animState = this.targetAnimations.get(target);
    if (animState && !animState.isAnimating) {
      animState.isAnimating = true;
      animState.animationProgress = 0;
      animState.startRotation = target.rotation.clone();
    }
  }

  /**
   * Updates all target animations and movements
   * @param {number} delta - Time delta for animation updates
   */
  updateAnimations(delta) {
    this.targets.forEach((target) => {
      // Update elimination animations
      const animState = this.targetAnimations.get(target);
      if (animState && animState.isAnimating) {
        animState.animationProgress += delta / animState.animationDuration;

        if (animState.animationProgress >= 1.0) {
          // Animation complete
          animState.isAnimating = false;
          target.rotation.copy(animState.targetRotation);
          target.visible = false; // Hide after animation
        } else {
          // Interpolate rotation
          const t = animState.animationProgress;
          // Use smooth easing function
          const easedT = 1 - Math.pow(1 - t, 3); // Ease out cubic

          target.rotation.x = THREE.MathUtils.lerp(
            animState.startRotation.x,
            animState.targetRotation.x,
            easedT
          );
          target.rotation.y = THREE.MathUtils.lerp(
            animState.startRotation.y,
            animState.targetRotation.y,
            easedT
          );
          target.rotation.z = THREE.MathUtils.lerp(
            animState.startRotation.z,
            animState.targetRotation.z,
            easedT
          );
        }
      }

      // Update movement for moving targets
      const moveState = this.targetMovements.get(target);
      if (moveState && target.visible) {
        moveState.time += delta;

        const time = moveState.time * moveState.speed;
        const amplitude = moveState.amplitude;

        let offsetX = 0;
        let offsetZ = 0;

        if (moveState.axis === 'x' || moveState.axis === 'both') {
          offsetX = Math.sin(time) * amplitude;
        }
        if (moveState.axis === 'z' || moveState.axis === 'both') {
          offsetZ = Math.cos(time) * amplitude;
        }

        target.position.x = moveState.startPosition.x + offsetX;
        target.position.z = moveState.startPosition.z + offsetZ;
      }
    });
  }

  /**
   * Changes the target configuration and recreates targets
   * @param {Object} newConfig - New target configuration object
   */
  changeConfiguration(newConfig) {
    // Remove existing targets
    this.targets.forEach((target) => {
      this.scene.remove(target);
    });

    // Update configuration
    this.config = newConfig;
    this.count = newConfig.count;

    // Clear existing maps
    this.targetAnimations.clear();
    this.targetMovements.clear();

    // Recreate targets with new configuration
    this.targets = [];
    this.setupTargets();

    // Emit configuration change event
    this.eventBus.emit(TARGET_CONFIG_CHANGED_EVENT_NAME);
  }
}
