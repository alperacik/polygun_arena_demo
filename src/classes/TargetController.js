import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import {
  PLAY_AGAIN_EVENT_NAME,
  GAME_OVER_EVENT_NAME,
} from '../helpers/EventNames';
import { GAME_CONFIG, ANIMATION_CONFIG } from '../helpers/constants';

export class TargetController {
  constructor(scene, targetObj, count, eventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.targetObj = targetObj;
    this.count = count;

    this.targets = [];
    this.targetAnimations = new Map(); // Track animation state for each target
    this.setupTargets();
    this.setupEventListeners();
  }

  setupTargets() {
    const position = new THREE.Vector3(
      GAME_CONFIG.TARGET_POSITION.x,
      GAME_CONFIG.TARGET_POSITION.y,
      GAME_CONFIG.TARGET_POSITION.z
    );

    for (let i = 0; i < this.count; i++) {
      const target = this.createTarget(position, i);
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
    }
  }

  createTarget(basePosition, index) {
    const target = SkeletonUtils.clone(this.targetObj);
    target.userData.hp = GAME_CONFIG.TARGET_HP;
    target.position.set(
      basePosition.x + index * GAME_CONFIG.TARGET_SPACING,
      basePosition.y,
      basePosition.z
    );
    target.scale.setScalar(GAME_CONFIG.TARGET_SCALE);
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
      target.userData.hp = GAME_CONFIG.TARGET_HP;
      target.userData.eliminated = false;
      // Reset animation state
      const animState = this.targetAnimations.get(target);
      if (animState) {
        animState.isAnimating = false;
        animState.animationProgress = 0;
        target.rotation.copy(animState.startRotation);
      }
    });
  }

  getTargets() {
    return this.targets;
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
      return this.checkAllTargetsEliminated();
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
    let gameOverShouldEmit = false;
    this.targets.forEach((target) => {
      const animState = this.targetAnimations.get(target);
      if (animState && animState.isAnimating) {
        animState.animationProgress += delta / animState.animationDuration;

        if (animState.animationProgress >= 1.0) {
          // Animation complete
          animState.isAnimating = false;
          target.rotation.copy(animState.targetRotation);
          target.visible = false; // Hide after animation
          // After hiding, check if all are eliminated and all animations are done
          if (this.shouldEmitGameOver()) {
            gameOverShouldEmit = true;
          }
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
    });
    if (gameOverShouldEmit) {
      this.eventBus.emit(GAME_OVER_EVENT_NAME);
    }
  }

  shouldEmitGameOver() {
    // All targets eliminated and no animation is running
    return this.targets.every(
      (target) =>
        target.userData.eliminated &&
        !this.targetAnimations.get(target)?.isAnimating
    );
  }

  checkAllTargetsEliminated() {
    return this.targets.every((target) => target.userData.eliminated);
  }
}
