import * as THREE from 'three';
import {
  X_AXIS_VECTOR,
  Y_AXIS_VECTOR,
  GAME_CONFIG,
  ANIMATION_CONFIG,
} from '../helpers/constants';
import { detectFPS } from '../helpers/utils';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
  SHOOTING_EVENT_NAME,
} from '../helpers/EventNames';

export class PlayerController {
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

    this.setupPlayer();
    this.setupWeapon(weaponObj);
    this.setupWeaponAnimations(weaponAnimObj);
    this.setupDebugControls();
    this.setupEventListeners();
    this.setupInitialState();
  }

  setupPlayer() {
    this.obj3D = new THREE.Object3D(); // Player container (holds cam & weapon)
    this.obj3D.position.set(
      GAME_CONFIG.PLAYER_INITIAL_POSITION.x,
      GAME_CONFIG.PLAYER_INITIAL_POSITION.y,
      GAME_CONFIG.PLAYER_INITIAL_POSITION.z
    );
    this.scene.add(this.obj3D);

    // camera
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      GAME_CONFIG.CAMERA_NEAR,
      GAME_CONFIG.CAMERA_FAR
    );
    this.camera.position.set(0, GAME_CONFIG.CAMERA_HEIGHT, 0);
    this.obj3D.add(this.camera);
  }

  setupWeapon(weaponObj) {
    this.weaponObj = weaponObj;
    this.weaponObj.rotateOnAxis(Y_AXIS_VECTOR, GAME_CONFIG.WEAPON_Y_ROTATION);
    this.weaponObj.rotateOnAxis(X_AXIS_VECTOR, GAME_CONFIG.WEAPON_X_ROTATION);
    this.weaponObj.position.y += GAME_CONFIG.WEAPON_Y_OFFSET;
    this.weaponObj.position.z += GAME_CONFIG.WEAPON_Z_OFFSET;
    this.weaponObj.scale.setScalar(GAME_CONFIG.WEAPON_SCALE);
    this.camera.add(this.weaponObj);
  }

  setupWeaponAnimations(weaponAnimObj) {
    this.currentWeaponActionName = '';
    this.weaponMixer = new THREE.AnimationMixer(this.weaponObj);
    const weaponClip = weaponAnimObj.animations[0];
    const weaponClipFPS = weaponClip.frameRate ?? detectFPS(weaponClip);

    this.weaponActionsMap = new Map();
    this.createWeaponActions(weaponClip, weaponClipFPS);
  }

  createWeaponActions(weaponClip, weaponClipFPS) {
    Object.entries(ANIMATION_CONFIG.WEAPON_ACTIONS).forEach(([, action]) => {
      const clipAction = this.weaponMixer.clipAction(
        THREE.AnimationUtils.subclip(
          weaponClip,
          action.name.charAt(0).toUpperCase() + action.name.slice(1),
          action.start,
          action.end,
          weaponClipFPS
        )
      );
      this.weaponActionsMap.set(action.name, clipAction);
    });
  }

  setupDebugControls() {
    if (this.enableDebug) {
      this.orbitControls = new OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.orbitControls.update();

      this.cameraHelper = new THREE.CameraHelper(this.camera);
      this.scene.add(this.cameraHelper);

      // Add movement boundary visualization
      this.createMovementBoundaryVisualization();
    }
  }

  createMovementBoundaryVisualization() {
    const bounds = GAME_CONFIG.MOVEMENT_BOUNDS;
    const geometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(
        bounds.MAX_X - bounds.MIN_X,
        0.1,
        bounds.MAX_Z - bounds.MIN_Z
      )
    );
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    this.boundaryVisualization = new THREE.LineSegments(geometry, material);
    this.boundaryVisualization.position.set(
      (bounds.MAX_X + bounds.MIN_X) / 2,
      0.05,
      (bounds.MAX_Z + bounds.MIN_Z) / 2
    );
    this.scene.add(this.boundaryVisualization);
  }

  setupEventListeners() {
    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.resetRotation();
      this.canFire = false;
    });

    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.resetToInitialState();
    });
  }

  setupInitialState() {
    this.rotationState = { yaw: 0, pitch: 0 };
    this.canFire = false;
    this.magAmmo = GAME_CONFIG.MAX_MAG_AMMO;

    this.initialData = {
      weaponObjPosition: this.weaponObj.position.clone(),
      weaponObjRotation: this.weaponObj.rotation.clone(),
      obj3DPosition: this.obj3D.position.clone(),
      obj3DRotation: this.obj3D.rotation.clone(),
      cameraPosition: this.camera.position.clone(),
      cameraRotation: this.camera.rotation.clone(),
    };

    this.playWeaponAnim(
      ANIMATION_CONFIG.WEAPON_ACTIONS.DEPLOY.name,
      () => {
        this.canFire = true;
        this.playWeaponAnim(
          ANIMATION_CONFIG.WEAPON_ACTIONS.IDLE.name,
          null,
          true
        );
      },
      false
    );
  }

  resetRotation() {
    this.rotationState = { yaw: 0, pitch: 0 };
  }

  resetToInitialState() {
    this.obj3D.position.copy(this.initialData.obj3DPosition);
    this.obj3D.rotation.copy(this.initialData.obj3DRotation);
    this.camera.position.copy(this.initialData.cameraPosition);
    this.camera.rotation.copy(this.initialData.cameraRotation);
    this.weaponObj.position.copy(this.initialData.weaponObjPosition);
    this.weaponObj.rotation.copy(this.initialData.weaponObjRotation);
    this.magAmmo = GAME_CONFIG.MAX_MAG_AMMO;

    this.playWeaponAnim(
      ANIMATION_CONFIG.WEAPON_ACTIONS.DEPLOY.name,
      () => {
        this.canFire = true;
        this.playWeaponAnim(
          ANIMATION_CONFIG.WEAPON_ACTIONS.IDLE.name,
          null,
          true
        );
      },
      false
    );
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

    // Emit shooting event for crosshair animation
    console.log('Emitting shooting event...');
    this.eventBus.emit(SHOOTING_EVENT_NAME);

    this.playWeaponAnim(
      ANIMATION_CONFIG.WEAPON_ACTIONS.FIRE.name,
      () => {
        if (this.magAmmo > 0) {
          this.canFire = true;
          this.playWeaponAnim(
            ANIMATION_CONFIG.WEAPON_ACTIONS.IDLE.name,
            null,
            true
          );
        } else {
          this.playWeaponAnim(
            ANIMATION_CONFIG.WEAPON_ACTIONS.RELOAD.name,
            () => {
              this.magAmmo = GAME_CONFIG.MAX_MAG_AMMO;
              this.canFire = true;
              this.playWeaponAnim(
                ANIMATION_CONFIG.WEAPON_ACTIONS.IDLE.name,
                null,
                true
              );
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
      direction.multiplyScalar(GAME_CONFIG.MOVE_SPEED * delta);

      // Calculate new position
      const newPosition = this.obj3D.position.clone().add(direction);

      // Apply movement boundaries
      newPosition.x = Math.max(
        GAME_CONFIG.MOVEMENT_BOUNDS.MIN_X,
        Math.min(GAME_CONFIG.MOVEMENT_BOUNDS.MAX_X, newPosition.x)
      );
      newPosition.z = Math.max(
        GAME_CONFIG.MOVEMENT_BOUNDS.MIN_Z,
        Math.min(GAME_CONFIG.MOVEMENT_BOUNDS.MAX_Z, newPosition.z)
      );

      // Update position with boundaries applied
      this.obj3D.position.copy(newPosition);
    }

    if (this.enableDebug) {
      this.orbitControls.update();
      this.cameraHelper.update();
    }
  }

  getCamera() {
    return this.camera;
  }

  getPosition() {
    return this.obj3D.position.clone();
  }

  isAtBoundary() {
    const pos = this.obj3D.position;
    const bounds = GAME_CONFIG.MOVEMENT_BOUNDS;

    return {
      atXMin: Math.abs(pos.x - bounds.MIN_X) < 0.1,
      atXMax: Math.abs(pos.x - bounds.MAX_X) < 0.1,
      atZMin: Math.abs(pos.z - bounds.MIN_Z) < 0.1,
      atZMax: Math.abs(pos.z - bounds.MAX_Z) < 0.1,
    };
  }
}
