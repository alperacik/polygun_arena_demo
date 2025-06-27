import * as THREE from 'three';
import { X_AXIS_VECTOR, Y_AXIS_VECTOR } from '../helpers/constants';
import { detectFPS } from '../helpers/utils';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

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
    this.createCrosshair();
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
    this.showHitMarker();
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

  update(direction, rotationState, delta) {
    if (this.weaponMixer) this.weaponMixer.update(delta);

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

  createCrosshair() {
    // Create crosshair container
    const crosshair = document.createElement('div');
    crosshair.style.position = 'fixed';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.width = '2vh';
    crosshair.style.height = '2vh';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.zIndex = '9999';

    // Create horizontal and vertical lines for main crosshair
    const hLine = document.createElement('div');
    hLine.style.position = 'absolute';
    hLine.style.width = '100%';
    hLine.style.height = '0.2vh';
    hLine.style.background = 'red';
    hLine.style.top = 'calc(50% - 0.1vh)';
    hLine.style.left = '0';

    const vLine = document.createElement('div');
    vLine.style.position = 'absolute';
    vLine.style.width = '0.2vh';
    vLine.style.height = '100%';
    vLine.style.background = 'red';
    vLine.style.left = 'calc(50% - 0.1vh)';
    vLine.style.top = '0';

    crosshair.appendChild(hLine);
    crosshair.appendChild(vLine);
    document.body.appendChild(crosshair);

    // Create hit marker container (on top of crosshair)
    this.hitMarker = document.createElement('div');
    this.hitMarker.style.position = 'fixed';
    this.hitMarker.style.top = '50%';
    this.hitMarker.style.left = '50%';
    this.hitMarker.style.width = '4vh';
    this.hitMarker.style.height = '4vh';
    this.hitMarker.style.transform = 'translate(-50%, -50%)';
    this.hitMarker.style.pointerEvents = 'none';
    this.hitMarker.style.zIndex = '10000';
    this.hitMarker.style.opacity = '0';
    this.hitMarker.style.transition = 'opacity 0.3s ease-out';

    // todo adjust visual
    // Create 4 lines for the hit marker (forming an X shape)
    const lines = [];
    for (let i = 0; i < 4; i++) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.width = '2vh';
      line.style.height = '0.2vh';
      line.style.background = 'yellow';
      line.style.top = i < 2 ? '0' : 'calc(100% - 0.2vh)';
      line.style.left = i % 2 === 0 ? '0' : 'calc(100% - 2vh)';
      line.style.transformOrigin = 'center';
      // line.style.transform = i % 2 === 0 ? 'rotate(45deg)' : 'rotate(-45deg)';
      line.style.transform =
        i === 0 || i === 3 ? 'rotate(45deg)' : 'rotate(-45deg)';
      this.hitMarker.appendChild(line);
      lines.push(line);
    }

    document.body.appendChild(this.hitMarker);
  }

  showHitMarker() {
    this.hitMarker.style.opacity = '1';
    setTimeout(() => {
      this.hitMarker.style.opacity = '0';
    }, 300);
  }
}
