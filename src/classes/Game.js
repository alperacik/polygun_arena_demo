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

export class Game {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.isGameOver = false;
    this.rotationState = { yaw: 0, pitch: 0 };
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.killCount = 0; // Track kill count

    this.setupScene();
    this.setupLights();
    this.setupGround();
    this.setupEventListeners();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color().setRGB(
      COLORS.SCENE_BACKGROUND.r,
      COLORS.SCENE_BACKGROUND.g,
      COLORS.SCENE_BACKGROUND.b
    );
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
  }

  setupGround() {
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GAME_CONFIG.GROUND_SIZE, GAME_CONFIG.GROUND_SIZE),
      new THREE.MeshBasicMaterial({
        color: COLORS.GROUND,
        side: THREE.FrontSide,
      })
    );
    this.ground.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.5);
    this.scene.add(this.ground);
  }

  setupEventListeners() {
    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.resetGame();
    });
  }

  resetGame() {
    this.isGameOver = false;
    this.rotationState.yaw = 0;
    this.rotationState.pitch = 0;
    this.killCount = 0; // Reset kill count
    this.eventBus.emit(KILL_COUNT_UPDATE_EVENT_NAME, this.killCount);
  }

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
          this.killCount++; // Increment kill count
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

  setPlayerController(playerController) {
    this.playerController = playerController;
  }

  setTargetController(targetController) {
    this.targetController = targetController;
  }

  getScene() {
    return this.scene;
  }

  getClock() {
    return this.clock;
  }

  getRotationState() {
    return this.rotationState;
  }

  isGameOver() {
    return this.isGameOver;
  }

  setGameOver(value) {
    this.isGameOver = value;
  }

  getKillCount() {
    return this.killCount;
  }
}
