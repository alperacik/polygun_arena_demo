import * as THREE from 'three';
import { CURRENT_TARGET_CONFIG } from '../helpers/constants';
import { Game } from './Game';
import { Renderer } from './Renderer';
import { PlayerController } from './PlayerController';
import { TargetController } from './TargetController';
import { Joystick } from './Joystick';
import { GameUIOverlay } from './GameUIOverlay';
import { AssetLoader } from './AssetLoader';
import { EventBus } from './EventBus';

export class GameManager {
  constructor(enableDebug = false) {
    this.enableDebug = enableDebug;
    this.eventBus = new EventBus();
    this.game = new Game(this.eventBus);
    this.renderer = new Renderer();
    this.gameUIOverlay = new GameUIOverlay(this.eventBus);

    this.moveJoystick = new Joystick(this.eventBus, true);
    this.rotateJoystick = new Joystick(this.eventBus, false);

    this.assetLoader = new AssetLoader();
    this.playerController = null;
    this.targetController = null;

    this.setupResizeHandling();
    this.setupAssetLoading();
  }

  setupResizeHandling() {
    this.renderer.setOnResizeCallback(() => {
      this.handleResize();
    });
  }

  setupAssetLoading() {
    this.assetLoader.loadCompleteCallback = () => {
      this.initializeGame();
    };
  }

  loadAssets(assets) {
    Object.entries(assets).forEach(([key, asset]) => {
      this.assetLoader.loadFBX(key, asset);
    });
  }

  initializeGame() {
    this.playerController = new PlayerController(
      this.game.getScene(),
      this.assetLoader.getFBX('mergedFBXBase64'),
      this.assetLoader.getFBX('mergedAnimFBXBase64'),
      this.enableDebug,
      this.renderer.getRenderer(),
      this.game.raycaster,
      this.eventBus
    );

    this.targetController = new TargetController(
      this.game.getScene(),
      this.assetLoader.getFBX('dummyTargetFBXBase64'),
      CURRENT_TARGET_CONFIG.count,
      this.eventBus,
      CURRENT_TARGET_CONFIG
    );

    this.game.setPlayerController(this.playerController);
    this.game.setTargetController(this.targetController);

    this.startGameLoop();
  }

  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
    };
    animate();
  }

  update() {
    const delta = this.game.getClock().getDelta();

    this.playerController.updateMixer(delta);
    this.targetController.updateAnimations(delta);
    const camera = this.playerController.getCamera();
    // Render the scene
    this.renderer.render(this.game.getScene(), camera);

    if (this.game.isGameOver) return;

    // Update rotation based on right joystick
    this.game.updateRotation(this.rotateJoystick.joystickInput, delta);
    this.rotateJoystick.resetJoystickInput();

    // Update movement based on left joystick
    const direction = new THREE.Vector3(
      this.moveJoystick.joystickInput.x,
      0,
      this.moveJoystick.joystickInput.y
    );

    this.playerController.update(
      direction,
      this.game.getRotationState(),
      delta
    );

    // Check for target hits
    const hitDetected = this.game.checkTargetHits(
      camera,
      this.targetController.getTargets()
    );

    if (hitDetected) {
      this.gameUIOverlay.showHitMarker();
    }
  }

  handleResize() {
    if (!this.playerController) return;

    const camera = this.playerController.getCamera();
    this.renderer.updateCameraAspect(camera);
    this.moveJoystick.resize();
    this.rotateJoystick.resize();
    this.gameUIOverlay.resize();
  }

  dispose() {
    this.renderer.dispose();
    this.gameUIOverlay.dispose();
    // Add any other cleanup needed
  }
}
