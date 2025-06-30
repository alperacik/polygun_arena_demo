/**
 * @fileoverview GameManager class serving as the main orchestrator for the entire game.
 * Manages initialization, game loop, asset loading, and coordination between all game components.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

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

/**
 * GameManager class orchestrating all game components and systems
 * Serves as the main entry point for game initialization and management
 */
export class GameManager {
  /**
   * Creates a new GameManager instance and initializes all game systems
   * @param {boolean} [enableDebug=false] - Enable debug mode for development
   * @constructor
   */
  constructor(enableDebug = false) {
    /** @type {boolean} Debug mode flag for development features */
    this.enableDebug = enableDebug;
    /** @type {EventBus} Central event bus for game-wide communication */
    this.eventBus = new EventBus();
    /** @type {Game} Main game logic and scene management */
    this.game = new Game(this.eventBus);
    /** @type {Renderer} WebGL renderer and viewport management */
    this.renderer = new Renderer();
    /** @type {GameUIOverlay} UI overlay for game interface */
    this.gameUIOverlay = new GameUIOverlay(this.eventBus);

    /** @type {Joystick} Left joystick for movement control (multi-touch supported) */
    this.moveJoystick = new Joystick(this.eventBus, true);
    /** @type {Joystick} Right joystick for rotation control (multi-touch supported) */
    this.rotateJoystick = new Joystick(this.eventBus, false);

    /** @type {AssetLoader} Asset loading and management system */
    this.assetLoader = new AssetLoader();
    /** @type {PlayerController|null} Player controller instance */
    this.playerController = null;
    /** @type {TargetController|null} Target controller instance */
    this.targetController = null;

    this.setupResizeHandling();
    this.setupAssetLoading();
  }

  /**
   * Sets up resize handling for responsive game rendering
   * Configures renderer callback for window resize events
   */
  setupResizeHandling() {
    this.renderer.setOnResizeCallback(() => {
      this.handleResize();
    });
  }

  /**
   * Sets up asset loading completion callback
   * Initializes game components once all assets are loaded
   */
  setupAssetLoading() {
    this.assetLoader.loadCompleteCallback = () => {
      this.initializeGame();
    };
  }

  /**
   * Loads game assets from base64 encoded data
   * @param {Object.<string, string>} assets - Object containing asset keys and base64 data
   */
  loadAssets(assets) {
    Object.entries(assets).forEach(([key, asset]) => {
      if (key.includes('FBX')) {
        this.assetLoader.loadFBX(key, asset);
      } else if (
        key.includes('Texture') ||
        key.includes('basecolor') ||
        key.includes('.png')
      ) {
        this.assetLoader.loadTexture(key, asset);
      }
    });
  }

  /**
   * Initializes game components after asset loading is complete
   * Creates player and target controllers and starts the game loop
   */
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
      CURRENT_TARGET_CONFIG,
      this.assetLoader.getTexture('dummyTargetTextureBase64')
    );

    this.game.setPlayerController(this.playerController);
    this.game.setTargetController(this.targetController);

    this.startGameLoop();
  }

  /**
   * Starts the main game loop using requestAnimationFrame
   * Continuously updates game state and renders the scene
   */
  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.update();
    };
    animate();
  }

  /**
   * Main update function called every frame
   * Updates all game systems, handles input, and renders the scene
   */
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

  /**
   * Handles window resize events by updating all responsive components
   * Updates camera aspect ratio and resizes UI elements
   */
  handleResize() {
    if (!this.playerController) return;

    const camera = this.playerController.getCamera();
    this.renderer.updateCameraAspect(camera);
    this.moveJoystick.resize();
    this.rotateJoystick.resize();
    this.gameUIOverlay.resize();
  }

  /**
   * Disposes of all game resources and cleans up memory
   * Should be called when the game is no longer needed
   */
  dispose() {
    this.renderer.dispose();
    this.gameUIOverlay.dispose();
    // Add any other cleanup needed
  }
}
