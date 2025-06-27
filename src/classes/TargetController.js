import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { PLAY_AGAIN_EVENT_NAME } from '../helpers/EventNames';
import { GAME_CONFIG } from '../helpers/constants';

export class TargetController {
  constructor(scene, targetObj, count, eventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.targetObj = targetObj;
    this.count = count;

    this.targets = [];
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
      target.visible = false;
      return this.checkAllTargetsEliminated();
    }

    return false;
  }

  checkAllTargetsEliminated() {
    return this.targets.every((target) => !target.visible);
  }
}
