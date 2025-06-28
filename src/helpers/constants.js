import * as THREE from 'three';

export const X_AXIS_VECTOR = new THREE.Vector3(1, 0, 0);
export const Y_AXIS_VECTOR = new THREE.Vector3(0, 1, 0);
export const Z_AXIS_VECTOR = new THREE.Vector3(0, 0, 1);
export const CENTER = new THREE.Vector2(0, 0);

// Game configuration
export const GAME_CONFIG = {
  MAX_MAG_AMMO: 7,
  MOVE_SPEED: 50,
  ROTATION_SPEED: 10,
  TARGET_COUNT: 10,
  TARGET_HP: 4,
  TARGET_SPACING: 10,
  TARGET_SCALE: 0.08,
  TARGET_POSITION: { x: -45, y: 0, z: -50 },
  GROUND_SIZE: 200,
  CAMERA_HEIGHT: 20,
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  WEAPON_SCALE: 0.15,
  WEAPON_Y_OFFSET: -24.5,
  WEAPON_Z_OFFSET: -2.5,
  WEAPON_Y_ROTATION: Math.PI * 1.05,
  WEAPON_X_ROTATION: -Math.PI * 0.02,
  PITCH_CLAMP: Math.PI * 0.1,
  KILL_COUNT_TO_WIN: 10, // Number of kills needed to win the game
  // Player initial position
  PLAYER_INITIAL_POSITION: { x: 0, y: 0, z: 40 },
  // Movement boundaries (half of GROUND_SIZE to keep player within the ground)
  MOVEMENT_BOUNDS: {
    MIN_X: -50,
    MAX_X: 50,
    MIN_Z: -50,
    MAX_Z: 50,
  },
};

// Target configuration presets
export const TARGET_CONFIGS = {
  // Default linear arrangement
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
    rows: 3,
    cols: 4,
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
    rows: 3,
    spacing: { x: 10, z: 10 },
    basePosition: { x: -20, y: 0, z: -50 },
    scale: 0.08,
    hp: 4,
  },

  // Moving targets (for future implementation)
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
      axis: 'x', // 'x', 'z', or 'both'
    },
  },
};

// Current target configuration (change this to switch layouts)
export const CURRENT_TARGET_CONFIG = TARGET_CONFIGS.LINEAR;

// Utility function to switch target configurations
export const switchTargetConfig = (configName) => {
  const config = TARGET_CONFIGS[configName.toUpperCase()];
  if (!config) {
    console.warn(
      `Target configuration "${configName}" not found. Available:`,
      Object.keys(TARGET_CONFIGS)
    );
    return TARGET_CONFIGS.LINEAR;
  }
  return config;
};

// Computed effective kill count (ensures game is always winnable)
// Uses the current target configuration count instead of the old GAME_CONFIG.TARGET_COUNT
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
export const JOYSTICK_CONFIG = {
  BASE_SIZE_RATIO: 0.14,
  STICK_SIZE_RATIO: 0.5,
  MAX_RADIUS_RATIO: 0.35,
  TRANSITION_DURATION: '40ms',
};

// UI configuration
export const UI_CONFIG = {
  CROSSHAIR_SIZE: '2vh',
  CROSSHAIR_THICKNESS: '0.2vh',
  CROSSHAIR_SPREAD_DURATION: 200, // Duration of spread animation in ms
  CROSSHAIR_SPREAD_MULTIPLIER: 2.5, // How much the lines spread when shooting
  HIT_MARKER_SIZE: '6vh',
  HIT_MARKER_LINE_LENGTH: '2vh',
  HIT_MARKER_GAP: '1vh',
  HIT_MARKER_THICKNESS: '0.2vh',
  HIT_MARKER_DURATION: 300,
  BUTTON_PADDING: '2vh 4vh',
  BUTTON_FONT_SIZE: '2.2vh',
  BUTTON_BORDER_RADIUS: '1vh',
  BUTTON_MIN_WIDTH: '20vh',
  BUTTON_GAP: '2vh',
  OVERLAY_BACKGROUND: 'rgba(0,0,0,0.6)',
};

// Animation configuration
export const ANIMATION_CONFIG = {
  WEAPON_ACTIONS: {
    DEPLOY: { name: 'deploy', start: 0, end: 29 },
    IDLE: { name: 'idle', start: 30, end: 31 },
    FIRE: { name: 'fire', start: 32, end: 56 },
    RELOAD: { name: 'reload', start: 58, end: 127 },
  },
  TARGET_ELIMINATION: {
    DURATION: 1.0, // Animation duration in seconds
    ROTATION_X: -Math.PI / 2, // Rotate 90 degrees around X-axis (fall backwards)
    EASING: 'easeOutCubic', // Easing function type
  },
};

// Colors
export const COLORS = {
  GROUND: 0xffff00,
  SCENE_BACKGROUND: { r: 0.5, g: 0.7, b: 0.5 },
  CROSSHAIR: 'red',
  HIT_MARKER: 'yellow',
  BUTTON_BACKGROUND: '#fff',
  BUTTON_HOVER: '#eee',
  BUTTON_TEXT: '#000',
  JOYSTICK_BASE: 'rgba(100,100,100,.35)',
  JOYSTICK_STICK: 'rgba(255,255,255,.6)',
};

// App links
export const APP_LINKS = {
  ANDROID:
    'https://play.google.com/store/apps/details?id=com.polygon.arena&hl=en',
  IOS: 'https://apps.apple.com/us/app/polygun-arena-online-shooter/id64510407809',
};
