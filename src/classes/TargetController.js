import * as THREE from 'three';
import { SkeletonUtils } from 'three/examples/jsm/Addons.js';

export class TargetController {
  constructor(scene, targetObj, count) {
    this.scene = scene;

    const scale = 0.08;
    const hp = 5;

    this.targets = [];
    const position = new THREE.Vector3(-45, 0, -50);
    for (let i = 0; i < count; i++) {
      const target = SkeletonUtils.clone(targetObj);
      target.userData.hp = hp;
      target.position.set(position.x + i * 10, position.y, position.z);
      target.scale.setScalar(scale);
      this.scene.add(target);
      this.targets.push(target);
    }
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
      return this.checkAllTargetsEliminated(); // game over
    }
  }

  checkAllTargetsEliminated() {
    return this.targets.every((target) => !target.visible);
  }
}
