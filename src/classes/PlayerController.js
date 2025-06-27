import * as THREE from 'three';
import { X_AXIS_VECTOR, Y_AXIS_VECTOR } from '../helpers/constants';
import { detectFPS } from '../helpers/utils';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
} from '../helpers/EventNames';

const MAX_MAG_AMMO = 10;
const MOVE_SPEED = 10;
const WEAPON_DEPLOY_ACTION_NAME = 'deploy';
const WEAPON_IDLE_ACTION_NAME = 'idle';
const WEAPON_FIRE_ACTION_NAME = 'fire';
const WEAPON_RELOAD_ACTION_NAME = 'reload';

export class PlayerController {
  /**
   *
   * @param {*} scene
   * @param {*} weaponObj
   * @param {*} weaponAnimObj
   * @param {*} enableDebug
   * @param {*} renderer
   * @param {*} raycaster
   * @param {*} eventBus
   */
  constructor(
    scene,
    weaponObj,
    weaponAnimObj,
    enableDebug,
    renderer,
    raycaster,
    eventBus
  ) {
    this.enableDebug = enableDebug;
    this.renderer = renderer;
    this.raycaster = raycaster;
    this.eventBus = eventBus;
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
    this.weaponObj.rotateOnAxis(Y_AXIS_VECTOR, Math.PI * 1.05); // y axis
    this.weaponObj.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.02); // x axis
    this.weaponObj.position.y -= 24.5;
    this.weaponObj.position.z -= 2.5;
    const weaponObjScale = 0.15;
    this.weaponObj.scale.set(weaponObjScale, weaponObjScale, weaponObjScale);
    this.camera.add(this.weaponObj);

    // weapon anims
    this.currentWeaponActionName = '';
    this.weaponMixer = new THREE.AnimationMixer(this.weaponObj);
    const weaponClip = weaponAnimObj.animations[0];
    const weaponClipFPS = weaponClip.frameRate ?? detectFPS(weaponClip);
    this.weaponActionsMap = new Map();
    this.weaponActionsMap.set(
      WEAPON_DEPLOY_ACTION_NAME,
      this.weaponMixer.clipAction(
        THREE.AnimationUtils.subclip(weaponClip, 'Deploy', 0, 29, weaponClipFPS)
      )
    );
    this.weaponActionsMap.set(
      WEAPON_IDLE_ACTION_NAME,
      this.weaponMixer.clipAction(
        THREE.AnimationUtils.subclip(weaponClip, 'Idle', 30, 31, weaponClipFPS)
      )
    );
    this.weaponActionsMap.set(
      WEAPON_FIRE_ACTION_NAME,
      this.weaponMixer.clipAction(
        THREE.AnimationUtils.subclip(weaponClip, 'Fire', 32, 56, weaponClipFPS)
      )
    );
    this.weaponActionsMap.set(
      WEAPON_RELOAD_ACTION_NAME,
      this.weaponMixer.clipAction(
        THREE.AnimationUtils.subclip(
          weaponClip,
          'Reload',
          58,
          127,
          weaponClipFPS
        )
      )
    );

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

    this.rotationState = { yaw: 0, pitch: 0 };

    this.canFire = false;
    this.magAmmo = MAX_MAG_AMMO;
    this.playWeaponAnim(
      WEAPON_DEPLOY_ACTION_NAME,
      () => {
        this.canFire = true;
        this.playWeaponAnim(WEAPON_IDLE_ACTION_NAME, null, true);
      },
      false
    );

    this.initialData = {
      weaponObjPosition: this.weaponObj.position.clone(),
      weaponObjRotation: this.weaponObj.rotation.clone(),
      obj3DPosition: this.obj3D.position.clone(),
      obj3DRotation: this.obj3D.rotation.clone(),
      cameraPosition: this.camera.position.clone(),
      cameraRotation: this.camera.rotation.clone(),
    };

    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.rotationState = { yaw: 0, pitch: 0 };
      this.canFire = false;
    });
    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.obj3D.position.copy(this.initialData.obj3DPosition);
      this.obj3D.rotation.copy(this.initialData.obj3DRotation);
      this.camera.position.copy(this.initialData.cameraPosition);
      this.camera.rotation.copy(this.initialData.cameraRotation);
      this.weaponObj.position.copy(this.initialData.weaponObjPosition);
      this.weaponObj.rotation.copy(this.initialData.weaponObjRotation);
      this.magAmmo = MAX_MAG_AMMO;
      this.playWeaponAnim(
        WEAPON_DEPLOY_ACTION_NAME,
        () => {
          this.canFire = true;
          this.playWeaponAnim(WEAPON_IDLE_ACTION_NAME, null, true);
        },
        false
      );
    });
  }

  isWeaponReady() {
    return this.canFire && this.magAmmo > 0;
  }

  playWeaponAnim(actionName, onCompleteCallback = null, loop = true) {
    const action = this.weaponActionsMap.get(actionName);
    console.log(actionName);

    if (this.currentWeaponActionName === actionName) {
      return;
    }

    this.currentWeaponActionName = actionName;
    if (onCompleteCallback) {
      const onCompleteCallbackWrapper = () => {
        onCompleteCallback();
        this.weaponMixer.removeEventListener(
          'finished',
          onCompleteCallbackWrapper
        );
      };
      this.weaponMixer.addEventListener('finished', onCompleteCallbackWrapper);
    }
    action
      .reset()
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1)
      .play();
    if (!loop) {
      action.clampWhenFinished = true;
    }
  }

  fireWeapon() {
    this.magAmmo--;
    console.log('ammo', this.magAmmo);
    this.canFire = false;
    this.playWeaponAnim(
      WEAPON_FIRE_ACTION_NAME,
      () => {
        if (this.magAmmo > 0) {
          this.canFire = true;
          this.playWeaponAnim(WEAPON_IDLE_ACTION_NAME, null, true);
        } else {
          this.playWeaponAnim(
            WEAPON_RELOAD_ACTION_NAME,
            () => {
              this.magAmmo = MAX_MAG_AMMO;
              this.canFire = true;
              this.playWeaponAnim(WEAPON_IDLE_ACTION_NAME, null, true);
            },
            false
          );
        }
      },
      false
    );
  }

  updateMixer(delta) {
    if (this.weaponMixer) this.weaponMixer.update(delta);
  }

  update(direction, rotationState, delta) {
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

  getCamera() {
    return this.camera;
  }
}
