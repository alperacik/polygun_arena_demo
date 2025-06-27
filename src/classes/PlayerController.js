import * as THREE from 'three';
import {
  CENTER,
  X_AXIS_VECTOR,
  Y_AXIS_VECTOR,
  Z_AXIS_VECTOR,
} from '../helpers/constants';
import { detectFPS } from '../helpers/utils';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const MOVE_SPEED = 10;
const WEAPON_DEPLOY_CLIP_NAME = 'deploy';
const WEAPON_IDLE_CLIP_NAME = 'idle';
const WEAPON_FIRE_CLIP_NAME = 'fire';
const WEAPON_RELOAD_CLIP_NAME = 'reload';

export class PlayerController {
  /**
   *
   * @param {*} scene
   * @param {*} weaponObj
   * @param {*} weaponAnimObj
   * @param {*} enableDebug
   * @param {*} renderer
   */
  constructor(
    scene,
    weaponObj,
    weaponAnimObj,
    enableDebug,
    renderer,
    raycaster
  ) {
    this.enableDebug = enableDebug;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.scene = scene;

    this.obj3D = new THREE.Object3D(); // Player container (holds cam & weapon)
    this.scene.add(this.obj3D);

    // camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 0); // height of eyes from ground
    this.obj3D.add(this.camera);

    // weapon obj
    this.weaponObj = weaponObj;
    this.weaponObj.rotateOnAxis(Y_AXIS_VECTOR, Math.PI); // y axis
    this.weaponObj.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.12); // x axis
    this.weaponObj.rotateOnAxis(Z_AXIS_VECTOR, Math.PI * 0.12); // z axis
    this.weaponObj.position.y -= 20.5;
    this.weaponObj.position.x -= 6;
    this.weaponObj.position.z -= 8;
    const weaponObjScale = 0.15;
    this.weaponObj.scale.set(weaponObjScale, weaponObjScale, weaponObjScale);
    this.camera.add(this.weaponObj);

    // weapon anims
    this.weaponMixer = new THREE.AnimationMixer(this.weaponObj);
    const weaponClip = weaponAnimObj.animations[0];
    const weaponClipFPS = weaponClip.frameRate ?? detectFPS(weaponClip);
    this.weaponSubClips = {
      WEAPON_DEPLOY_CLIP_NAME: THREE.AnimationUtils.subclip(
        weaponClip,
        'Deploy',
        0,
        29,
        weaponClipFPS
      ),
      WEAPON_IDLE_CLIP_NAME: THREE.AnimationUtils.subclip(
        weaponClip,
        'Idle',
        30,
        31,
        weaponClipFPS
      ),
      WEAPON_FIRE_CLIP_NAME: THREE.AnimationUtils.subclip(
        weaponClip,
        'Fire',
        32,
        56,
        weaponClipFPS
      ),
      WEAPON_RELOAD_CLIP_NAME: THREE.AnimationUtils.subclip(
        weaponClip,
        'Reload',
        58,
        127,
        weaponClipFPS
      ),
    };

    if (this.enableDebug) {
      // control camera
      this.orbitControls = new OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.orbitControls.update();

      // camera helper
      this.cameraHelper = new THREE.CameraHelper(this.camera);
      this.scene.add(this.cameraHelper);
    }

    // todo
    //     if (clip) {
    //     const action = weaponMixer.clipAction(idleClip);
    //     action.play();
    //   }

    this.rotationState = { yaw: 0, pitch: 0 };
  }

  update(direction, rotationState, delta) {
    if (this.weaponMixer) this.weaponMixer.update(delta);

    this.raycaster.setFromCamera(CENTER, this.camera);
    const intersects = this.raycaster.intersectObjects(this.targets, true);

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      console.log(
        'Hit:',
        firstHit.object.name || firstHit.object,
        firstHit.point
      );
    }

    this.obj3D.rotation.y = rotationState.yaw;
    this.camera.rotation.x = rotationState.pitch;

    if (direction.lengthSq() > 0) {
      direction.normalize().applyAxisAngle(Y_AXIS_VECTOR, rotationState.yaw);
      direction.multiplyScalar(MOVE_SPEED * delta);
      this.obj3D.position.add(direction);
    }

    if (this.enableDebug) {
      this.orbitControls.update();
      this.cameraHelper.update();
    }
  }

  setTargets(arr) {
    this.targets = arr;
  }

  getCamera() {
    return this.camera;
  }
}
