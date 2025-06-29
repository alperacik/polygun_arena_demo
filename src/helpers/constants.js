/**
 * @fileoverview Game constants and configuration values used throughout the application.
 * Contains game settings, target configurations, UI settings, and animation parameters.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Three.js vector representing the X-axis
 * @type {THREE.Vector3}
 */
export const X_AXIS_VECTOR = new THREE.Vector3(1, 0, 0);

/**
 * Three.js vector representing the Y-axis
 * @type {THREE.Vector3}
 */
export const Y_AXIS_VECTOR = new THREE.Vector3(0, 1, 0);

// Game configuration
/**
 * Main game configuration object containing all game settings
 * @type {Object}
 */
export const GAME_CONFIG = {
  /** Maximum ammunition in magazine */
  MAX_MAG_AMMO: 7,
  /** Player movement speed */
  MOVE_SPEED: 50,
  /** Player rotation speed */
  ROTATION_SPEED: 10,
  /** Size of the ground plane */
  GROUND_SIZE: 200,
  /** Camera height from ground */
  CAMERA_HEIGHT: 20,
  /** Camera field of view in degrees */
  CAMERA_FOV: 75,
  /** Camera near clipping plane */
  CAMERA_NEAR: 0.1,
  /** Camera far clipping plane */
  CAMERA_FAR: 1000,
  /** Weapon model scale */
  WEAPON_SCALE: 0.15,
  /** Weapon Y-axis offset */
  WEAPON_Y_OFFSET: -24.5,
  /** Weapon Z-axis offset */
  WEAPON_Z_OFFSET: -2.5,
  /** Weapon Y-axis rotation in radians */
  WEAPON_Y_ROTATION: Math.PI * 1.05,
  /** Weapon X-axis rotation in radians */
  WEAPON_X_ROTATION: -Math.PI * 0.02,
  /** Maximum pitch angle for camera in radians */
  PITCH_CLAMP: Math.PI * 0.1,
  /** Number of kills needed to win the game */
  KILL_COUNT_TO_WIN: 20, // Number of kills needed to win the game
  // Player initial position
  /** Player initial position coordinates */
  PLAYER_INITIAL_POSITION: { x: 0, y: 0, z: 40 },
  // Movement boundaries (half of GROUND_SIZE to keep player within the ground)
  /** Movement boundaries to keep player within the ground */
  MOVEMENT_BOUNDS: {
    MIN_X: -50,
    MAX_X: 50,
    MIN_Z: -50,
    MAX_Z: 50,
  },
};

// Target configuration presets
/**
 * Target configuration presets for different target arrangements
 * @type {Object.<string, Object>}
 */
export const TARGET_CONFIGS = {
  // Default linear arrangement
  /** Default linear arrangement */
  LINEAR: {
    name: 'Linear',
    layout: 'linear',
    count: 10,
    spacing: 10,
    basePosition: { x: -45, y: 0, z: -50 },
    scale: 0.08,
    hp: 4,
  },

  // Circular arrangement
  CIRCULAR: {
    name: 'Circular',
    layout: 'circular',
    count: 8,
    radius: 30,
    centerPosition: { x: 0, y: 0, z: -50 },
    scale: 0.08,
    hp: 3,
    startAngle: 0, // Starting angle in radians
  },

  // Grid arrangement
  GRID: {
    name: 'Grid',
    layout: 'grid',
    rows: 5,
    cols: 7,
    spacing: { x: 12, z: 12 },
    basePosition: { x: -30, y: 0, z: -50 },
    scale: 0.08,
    hp: 5,
  },

  // V-shaped formation
  V_FORMATION: {
    name: 'V Formation',
    layout: 'v_formation',
    count: 7,
    angle: Math.PI / 3, // 60 degrees
    basePosition: { x: 0, y: 0, z: -50 },
    spacing: 8,
    scale: 0.08,
    hp: 4,
  },

  // Random scattered positions
  SCATTERED: {
    name: 'Scattered',
    layout: 'scattered',
    count: 12,
    bounds: {
      minX: -40,
      maxX: 40,
      minZ: -60,
      maxZ: -30,
      y: 0,
    },
    scale: 0.08,
    hp: 3,
    minDistance: 8, // Minimum distance between targets
  },

  // Pyramid formation
  PYRAMID: {
    name: 'Pyramid',
    layout: 'pyramid',
    baseCount: 5, // Targets in bottom row
    rows: 5,
    spacing: { x: 10, z: 10 },
    basePosition: { x: 0, y: 0, z: -50 },
    scale: 0.08,
    hp: 4,
  },

  // Moving targets
  MOVING: {
    name: 'Moving Targets',
    layout: 'moving',
    count: 6,
    basePosition: { x: -30, y: 0, z: -50 },
    spacing: 12,
    scale: 0.08,
    hp: 3,
    movement: {
      enabled: true,
      amplitude: 5,
      speed: 2,
      axis: 'both', // 'x', 'z', or 'both'
    },
  },
};

// Current target configuration (change this to switch layouts)
/**
 * Current target configuration (change this to switch layouts)
 * @type {Object}
 */
export const CURRENT_TARGET_CONFIG = TARGET_CONFIGS.LINEAR;

// Computed effective kill count (ensures game is always winnable)
// Uses the current target configuration count instead of the old GAME_CONFIG.TARGET_COUNT
/**
 * Computed effective kill count (ensures game is always winnable)
 * Uses the current target configuration count instead of the old GAME_CONFIG.TARGET_COUNT
 * @returns {number} The effective kill count needed to win
 */
export const getEffectiveKillCountToWin = () => {
  let currentTargetCount;

  // Handle special case for grid layout
  if (CURRENT_TARGET_CONFIG.layout === 'grid') {
    currentTargetCount =
      CURRENT_TARGET_CONFIG.rows * CURRENT_TARGET_CONFIG.cols;
  } else if (CURRENT_TARGET_CONFIG.layout === 'pyramid') {
    // Calculate pyramid count based on baseCount and rows
    currentTargetCount = 0;
    for (let row = 0; row < CURRENT_TARGET_CONFIG.rows; row++) {
      currentTargetCount += CURRENT_TARGET_CONFIG.baseCount - row;
    }
  } else {
    currentTargetCount = CURRENT_TARGET_CONFIG.count;
  }

  return Math.min(currentTargetCount, GAME_CONFIG.KILL_COUNT_TO_WIN);
};

// Joystick configuration
/**
 * Joystick configuration settings
 * @type {Object}
 */
export const JOYSTICK_CONFIG = {
  /** Base size ratio relative to screen */
  BASE_SIZE_RATIO: 0.14,
  /** Stick size ratio relative to base */
  STICK_SIZE_RATIO: 0.5,
  /** Maximum radius ratio for stick movement */
  MAX_RADIUS_RATIO: 0.35,
  /** CSS transition duration */
  TRANSITION_DURATION: '40ms',
};

// UI configuration
/**
 * UI configuration settings
 * @type {Object}
 */
export const UI_CONFIG = {
  /** Crosshair line thickness */
  CROSSHAIR_THICKNESS: '0.2vh',
  /** Duration of crosshair spread animation in ms */
  CROSSHAIR_SPREAD_DURATION: 200, // Duration of spread animation in ms
  /** Hit marker size */
  HIT_MARKER_SIZE: '6vh',
  /** Hit marker line length */
  HIT_MARKER_LINE_LENGTH: '2vh',
  /** Gap between hit marker lines */
  HIT_MARKER_GAP: '1vh',
  /** Hit marker line thickness */
  HIT_MARKER_THICKNESS: '0.2vh',
  /** Hit marker display duration in ms */
  HIT_MARKER_DURATION: 300,
  /** Button padding */
  BUTTON_PADDING: '2vh 4vh',
  /** Button font size */
  BUTTON_FONT_SIZE: '2.2vh',
  /** Button border radius */
  BUTTON_BORDER_RADIUS: '1vh',
  /** Button minimum width */
  BUTTON_MIN_WIDTH: '20vh',
  /** Gap between buttons */
  BUTTON_GAP: '2vh',
  /** Overlay background color */
  OVERLAY_BACKGROUND: 'rgba(0,0,0,0.6)',
};

// Animation configuration
/**
 * Animation configuration settings
 * @type {Object}
 */
export const ANIMATION_CONFIG = {
  /** Weapon animation actions with frame ranges */
  WEAPON_ACTIONS: {
    DEPLOY: { name: 'deploy', start: 0, end: 29 },
    IDLE: { name: 'idle', start: 30, end: 31 },
    FIRE: { name: 'fire', start: 32, end: 56 },
    RELOAD: { name: 'reload', start: 58, end: 127 },
  },
  /** Target elimination animation settings */
  TARGET_ELIMINATION: {
    /** Animation duration in seconds */
    DURATION: 1.0, // Animation duration in seconds
    /** Rotation around X-axis in radians (fall backwards) */
    ROTATION_X: -Math.PI / 2, // Rotate 90 degrees around X-axis (fall backwards)
  },
};

// Colors
/**
 * Color definitions used throughout the UI
 * @type {Object}
 */
export const COLORS = {
  /** Scene background color */
  SCENE_BACKGROUND: { r: 0.5, g: 0.7, b: 0.5 },
  /** Crosshair color */
  CROSSHAIR: 'red',
  /** Hit marker color */
  HIT_MARKER: 'yellow',
  /** Button background color */
  BUTTON_BACKGROUND: '#fff',
  /** Button hover color */
  BUTTON_HOVER: '#eee',
  /** Button text color */
  BUTTON_TEXT: '#000',
  /** Joystick base color */
  JOYSTICK_BASE: 'rgba(100,100,100,.35)',
  /** Joystick stick color */
  JOYSTICK_STICK: 'rgba(255,255,255,.6)',
};

// App links
/**
 * App store links for mobile platforms
 * @type {Object}
 */
export const APP_LINKS = {
  /** Android app store link */
  ANDROID:
    'https://play.google.com/store/apps/details?id=com.polygon.arena&hl=en',
  /** iOS app store link */
  IOS: 'https://apps.apple.com/us/app/polygun-arena-online-shooter/id64510407809',
};
