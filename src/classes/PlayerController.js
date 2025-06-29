/**
 * @fileoverview PlayerController class managing player movement, camera control, and weapon animations.
 * Handles player input, weapon firing mechanics, and debug controls for development.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

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

/**
 * PlayerController class managing player movement, camera, and weapon systems
 * Handles input processing, animation control, and game state management
 */
export class PlayerController {
  /**
   * Creates a new PlayerController instance with weapon and animation setup
   * @param {THREE.Scene} scene - The main game scene
   * @param {THREE.Group} weaponObj - Weapon 3D model object
   * @param {THREE.Group} weaponAnimObj - Weapon animation object
   * @param {boolean} enableDebug - Enable debug controls and visualization
   * @param {THREE.WebGLRenderer} renderer - WebGL renderer for debug controls
   * @param {THREE.Raycaster} raycaster - Raycaster for hit detection
   * @param {EventBus} eventBus - Event bus for game communication
   * @constructor
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
    /** @type {boolean} Debug mode flag for development features */
    this.enableDebug = enableDebug;
    /** @type {THREE.WebGLRenderer} WebGL renderer for debug controls */
    this.renderer = renderer;
    /** @type {THREE.Raycaster} Raycaster for hit detection */
    this.raycaster = raycaster;
    /** @type {EventBus} Event bus for game communication */
    this.eventBus = eventBus;
    /** @type {THREE.Scene} Main game scene */
    this.scene = scene;

    this.setupPlayer();
    this.setupWeapon(weaponObj);
    this.setupWeaponAnimations(weaponAnimObj);
    this.setupDebugControls();
    this.setupEventListeners();
    this.setupInitialState();
  }

  /**
   * Sets up the player object, camera, and initial positioning
   * Creates the main player container and perspective camera
   */
  setupPlayer() {
    /** @type {THREE.Object3D} Player container object holding camera and weapon */
    this.obj3D = new THREE.Object3D();
    this.obj3D.position.set(
      GAME_CONFIG.PLAYER_INITIAL_POSITION.x,
      GAME_CONFIG.PLAYER_INITIAL_POSITION.y,
      GAME_CONFIG.PLAYER_INITIAL_POSITION.z
    );
    this.scene.add(this.obj3D);

    /** @type {THREE.PerspectiveCamera} Main game camera */
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      GAME_CONFIG.CAMERA_NEAR,
      GAME_CONFIG.CAMERA_FAR
    );
    this.camera.position.set(0, GAME_CONFIG.CAMERA_HEIGHT, 0);
    this.obj3D.add(this.camera);
  }

  /**
   * Sets up the weapon model with proper positioning and scaling
   * @param {THREE.Group} weaponObj - Weapon 3D model to setup
   */
  setupWeapon(weaponObj) {
    /** @type {THREE.Group} Weapon 3D model object */
    this.weaponObj = weaponObj;
    this.weaponObj.rotateOnAxis(Y_AXIS_VECTOR, GAME_CONFIG.WEAPON_Y_ROTATION);
    this.weaponObj.rotateOnAxis(X_AXIS_VECTOR, GAME_CONFIG.WEAPON_X_ROTATION);
    this.weaponObj.position.y += GAME_CONFIG.WEAPON_Y_OFFSET;
    this.weaponObj.position.z += GAME_CONFIG.WEAPON_Z_OFFSET;
    this.weaponObj.scale.setScalar(GAME_CONFIG.WEAPON_SCALE);
    this.camera.add(this.weaponObj);
  }

  /**
   * Sets up weapon animations and creates animation mixer
   * @param {THREE.Group} weaponAnimObj - Weapon animation object
   */
  setupWeaponAnimations(weaponAnimObj) {
    /** @type {string} Current weapon animation action name */
    this.currentWeaponActionName = '';
    /** @type {THREE.AnimationMixer} Weapon animation mixer */
    this.weaponMixer = new THREE.AnimationMixer(this.weaponObj);
    const weaponClip = weaponAnimObj.animations[0];
    const weaponClipFPS = weaponClip.frameRate ?? detectFPS(weaponClip);

    /** @type {Map<string, THREE.AnimationAction>} Map of weapon animation actions */
    this.weaponActionsMap = new Map();
    this.createWeaponActions(weaponClip, weaponClipFPS);
  }

  /**
   * Creates weapon animation actions from the animation clip
   * @param {THREE.AnimationClip} weaponClip - Weapon animation clip
   * @param {number} weaponClipFPS - Frame rate of the weapon animation
   */
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

  /**
   * Sets up debug controls and visualization for development
   * Creates orbit controls and boundary visualization when debug is enabled
   */
  setupDebugControls() {
    if (this.enableDebug) {
      /** @type {OrbitControls} Debug orbit controls for camera manipulation */
      this.orbitControls = new OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.orbitControls.update();

      /** @type {THREE.CameraHelper} Debug camera helper visualization */
      this.cameraHelper = new THREE.CameraHelper(this.camera);
      this.scene.add(this.cameraHelper);

      // Add movement boundary visualization
      this.createMovementBoundaryVisualization();
    }
  }

  /**
   * Creates visual representation of movement boundaries for debug mode
   * Shows red wireframe box indicating player movement limits
   */
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
    /** @type {THREE.LineSegments} Debug boundary visualization */
    this.boundaryVisualization = new THREE.LineSegments(geometry, material);
    this.boundaryVisualization.position.set(
      (bounds.MAX_X + bounds.MIN_X) / 2,
      0.05,
      (bounds.MAX_Z + bounds.MIN_Z) / 2
    );
    this.scene.add(this.boundaryVisualization);
  }

  /**
   * Sets up event listeners for game state changes
   * Handles game over and play again events
   */
  setupEventListeners() {
    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.resetRotation();
      this.canFire = false;
    });

    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.resetToInitialState();
    });
  }

  /**
   * Sets up initial player state and weapon deployment
   * Initializes rotation, ammo, and plays weapon deploy animation
   */
  setupInitialState() {
    /** @type {Object} Current rotation state with yaw and pitch */
    this.rotationState = { yaw: 0, pitch: 0 };
    /** @type {boolean} Flag indicating if weapon can fire */
    this.canFire = false;
    /** @type {number} Current ammunition in magazine */
    this.magAmmo = GAME_CONFIG.MAX_MAG_AMMO;

    /** @type {Object} Initial state data for reset functionality */
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

  /**
   * Resets player rotation to zero
   * Clears yaw and pitch rotation values
   */
  resetRotation() {
    this.rotationState = { yaw: 0, pitch: 0 };
  }

  /**
   * Resets player to initial state including position, rotation, and ammo
   * Restores all initial data and plays weapon deploy animation
   */
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

  /**
   * Checks if the weapon is ready to fire
   * @returns {boolean} True if weapon can fire and has ammo, false otherwise
   */
  isWeaponReady() {
    return this.canFire && this.magAmmo > 0;
  }

  /**
   * Plays a weapon animation with optional callback and loop settings
   * @param {string} actionName - Name of the animation action to play
   * @param {Function|null} [onCompleteCallback=null] - Callback function when animation completes
   * @param {boolean} [loop=true] - Whether the animation should loop
   */
  playWeaponAnim(actionName, onCompleteCallback = null, loop = true) {
    const action = this.weaponActionsMap.get(actionName);

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

  /**
   * Fires the weapon, decrements ammo, and plays fire animation
   * Handles reload animation when magazine is empty
   */
  fireWeapon() {
    this.magAmmo--;
    this.canFire = false;

    // Emit shooting event for crosshair animation
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

  /**
   * Updates the weapon animation mixer with delta time
   * @param {number} delta - Time delta for animation updates
   */
  updateMixer(delta) {
    if (this.weaponMixer) this.weaponMixer.update(delta);
  }

  /**
   * Updates player position and rotation based on input
   * @param {THREE.Vector3} direction - Movement direction vector
   * @param {Object} rotationState - Current rotation state with yaw and pitch
   * @param {number} delta - Time delta for smooth movement
   */
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

  /**
   * Gets the main game camera
   * @returns {THREE.PerspectiveCamera} The main game camera
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Gets the current player position
   * @returns {THREE.Vector3} Clone of the player's current position
   */
  getPosition() {
    return this.obj3D.position.clone();
  }

  /**
   * Checks if the player is at any movement boundary
   * @returns {Object} Object indicating which boundaries the player is at
   */
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
