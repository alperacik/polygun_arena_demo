/**
 * @fileoverview Game class representing the main game logic and scene management.
 * Handles game state, target hit detection, rotation updates, and game reset functionality.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import * as THREE from 'three';
import {
  GAME_CONFIG,
  COLORS,
  X_AXIS_VECTOR,
  getEffectiveKillCountToWin,
} from '../helpers/constants';
import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
  KILL_COUNT_UPDATE_EVENT_NAME,
} from '../helpers/EventNames';

/**
 * Game class managing the main game logic, scene, and game state
 * Coordinates between player controller, target controller, and game events
 */
export class Game {
  /**
   * Creates a new Game instance with event bus and initializes game components
   * @param {EventBus} eventBus - Event bus for game-wide communication
   * @constructor
   */
  constructor(eventBus) {
    /** @type {EventBus} Event bus for game-wide communication */
    this.eventBus = eventBus;
    /** @type {boolean} Flag indicating if the game is over */
    this.isGameOver = false;
    /** @type {Object} Current rotation state with yaw and pitch values */
    this.rotationState = { yaw: 0, pitch: 0 };
    /** @type {THREE.Clock} Three.js clock for timing calculations */
    this.clock = new THREE.Clock();
    /** @type {THREE.Raycaster} Raycaster for hit detection */
    this.raycaster = new THREE.Raycaster();
    /** @type {number} Current kill count for win condition tracking */
    this.killCount = 0;

    this.setupScene();
    this.setupLights();
    this.setupGround();
    this.setupEventListeners();
  }

  /**
   * Sets up the Three.js scene with background color
   * Initializes the main scene container for all game objects
   */
  setupScene() {
    /** @type {THREE.Scene} Main Three.js scene */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color().setRGB(
      COLORS.SCENE_BACKGROUND.r,
      COLORS.SCENE_BACKGROUND.g,
      COLORS.SCENE_BACKGROUND.b
    );
  }

  /**
   * Sets up lighting for the scene with ambient and directional lights
   * Provides proper illumination for all game objects
   */
  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
  }

  /**
   * Sets up the ground plane with a checkerboard texture pattern
   * Creates a textured ground surface for the game environment
   */
  setupGround() {
    const size = 8;
    const data = new Uint8Array(size * size * 4);

    for (let i = 0; i < size * size; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      const isEven = (x + y) % 2 === 0;

      const offset = i * 4;
      if (isEven) {
        data[offset] = 170;
        data[offset + 1] = 230;
        data[offset + 2] = 170;
      } else {
        data[offset] = 0;
        data[offset + 1] = 100;
        data[offset + 2] = 255;
      }
      data[offset + 3] = 255;
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
    });

    /** @type {THREE.Mesh} Ground plane mesh */
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GAME_CONFIG.GROUND_SIZE, GAME_CONFIG.GROUND_SIZE),
      material
    );
    this.ground.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.5);
    this.scene.add(this.ground);
  }

  /**
   * Sets up event listeners for game events
   * Handles play again requests and target configuration changes
   */
  setupEventListeners() {
    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.resetGame();
      this.playerController.resetToInitialState();
      this.targetController.resetTargets();
    });
  }

  /**
   * Resets the game state to initial values
   * Clears game over flag, resets rotation and kill count
   */
  resetGame() {
    this.isGameOver = false;
    this.rotationState.yaw = 0;
    this.rotationState.pitch = 0;
    this.killCount = 0;
    this.eventBus.emit(KILL_COUNT_UPDATE_EVENT_NAME, this.killCount);
  }

  /**
   * Updates camera rotation based on joystick input
   * @param {Object} joystickInput - Joystick input values {x, y}
   * @param {number} delta - Time delta for smooth rotation
   */
  updateRotation(joystickInput, delta) {
    this.rotationState.yaw -=
      joystickInput.x * delta * GAME_CONFIG.ROTATION_SPEED;
    this.rotationState.pitch -=
      joystickInput.y * delta * GAME_CONFIG.ROTATION_SPEED;
    this.rotationState.pitch = Math.max(
      -GAME_CONFIG.PITCH_CLAMP,
      Math.min(GAME_CONFIG.PITCH_CLAMP, this.rotationState.pitch)
    );
  }

  /**
   * Checks for target hits using raycasting from camera center
   * @param {THREE.Camera} camera - Camera to cast ray from
   * @param {Array<THREE.Object3D>} targets - Array of target objects to check
   * @returns {boolean} True if a hit was detected, false otherwise
   */
  checkTargetHits(camera, targets) {
    if (!this.playerController?.isWeaponReady()) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      if (firstHit.object.parent.visible) {
        const targetEliminated = this.targetController.onHit(
          firstHit.object.parent
        );
        if (targetEliminated) {
          this.killCount++;
          this.eventBus.emit(KILL_COUNT_UPDATE_EVENT_NAME, this.killCount);

          // Check if kill count reached the effective win condition
          if (this.killCount >= getEffectiveKillCountToWin()) {
            this.isGameOver = true;
            this.eventBus.emit(GAME_OVER_EVENT_NAME);
          }
        }
        this.playerController.fireWeapon();
        return true; // Hit detected
      }
    }
    return false; // No hit
  }

  /**
   * Sets the player controller reference
   * @param {PlayerController} playerController - Player controller instance
   */
  setPlayerController(playerController) {
    this.playerController = playerController;
  }

  /**
   * Sets the target controller reference
   * @param {TargetController} targetController - Target controller instance
   */
  setTargetController(targetController) {
    this.targetController = targetController;
  }

  /**
   * Gets the main scene
   * @returns {THREE.Scene} The main game scene
   */
  getScene() {
    return this.scene;
  }

  /**
   * Gets the Three.js clock for timing
   * @returns {THREE.Clock} The game clock
   */
  getClock() {
    return this.clock;
  }

  /**
   * Gets the current rotation state
   * @returns {Object} Current rotation state with yaw and pitch
   */
  getRotationState() {
    return this.rotationState;
  }
}
