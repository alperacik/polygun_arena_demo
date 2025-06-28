import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import {
  PLAY_AGAIN_EVENT_NAME,
  TARGET_CONFIG_CHANGED_EVENT_NAME,
} from '../helpers/EventNames';
import { ANIMATION_CONFIG, CURRENT_TARGET_CONFIG } from '../helpers/constants';

export class TargetController {
  constructor(
    scene,
    targetObj,
    count,
    eventBus,
    config = CURRENT_TARGET_CONFIG
  ) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.targetObj = targetObj;
    this.count = count;
    this.config = config;

    this.targets = [];
    this.targetAnimations = new Map(); // Track animation state for each target
    this.targetMovements = new Map(); // Track movement state for moving targets
    this.setupTargets();
    this.setupEventListeners();
  }

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

  calculateScatteredPositions() {
    const positions = [];
    const bounds = this.config.bounds;

    for (let i = 0; i < this.config.count; i++) {
      let position;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        position = new THREE.Vector3(
          bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
          bounds.y,
          bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ)
        );
        attempts++;
      } while (
        attempts < maxAttempts &&
        this.isTooCloseToExisting(position, positions, this.config.minDistance)
      );

      positions.push(position);
    }
    return positions;
  }

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

  isTooCloseToExisting(newPos, existingPositions, minDistance) {
    return existingPositions.some(
      (pos) => newPos.distanceTo(pos) < minDistance
    );
  }

  createTarget(position) {
    const target = SkeletonUtils.clone(this.targetObj);
    target.userData.hp = this.config.hp;
    target.position.copy(position);
    target.scale.setScalar(this.config.scale);

    return target;
  }

  setupEventListeners() {
    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.resetTargets();
    });
  }

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

  getTargets() {
    return this.targets;
  }

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

  getCurrentTargetCount() {
    return this.targets.length;
  }

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

  startTargetEliminationAnimation(target) {
    const animState = this.targetAnimations.get(target);
    if (animState && !animState.isAnimating) {
      animState.isAnimating = true;
      animState.animationProgress = 0;
      animState.startRotation = target.rotation.clone();
    }
  }

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

      // Update movement animations for moving targets
      const moveState = this.targetMovements.get(target);
      if (moveState && !target.userData.eliminated) {
        moveState.time += delta * moveState.speed;

        if (moveState.axis === 'x' || moveState.axis === 'both') {
          target.position.x =
            moveState.startPosition.x +
            Math.sin(moveState.time) * moveState.amplitude;
        }

        if (moveState.axis === 'z' || moveState.axis === 'both') {
          target.position.z =
            moveState.startPosition.z +
            Math.sin(moveState.time) * moveState.amplitude;
        }
      }
    });
  }

  // Method to change target configuration at runtime
  changeConfiguration(newConfig) {
    // Remove existing targets
    this.targets.forEach((target) => {
      this.scene.remove(target);
    });

    this.targets = [];
    this.targetAnimations.clear();
    this.targetMovements.clear();

    // Update configuration
    this.config = newConfig;
    this.count = this.getTargetCount(); // Use calculated count instead of config.count

    // Setup new targets
    this.setupTargets();

    // Emit event to update UI with new target count
    this.eventBus.emit(TARGET_CONFIG_CHANGED_EVENT_NAME, {
      targetCount: this.getTargetCount(), // Use calculated count
      configName: this.config.name,
    });
  }
}
