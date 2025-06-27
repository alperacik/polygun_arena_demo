import * as THREE from 'three';

export const X_AXIS_VECTOR = new THREE.Vector3(1, 0, 0);
export const Y_AXIS_VECTOR = new THREE.Vector3(0, 1, 0);
export const Z_AXIS_VECTOR = new THREE.Vector3(0, 0, 1);
export const CENTER = new THREE.Vector2(0, 0);

// Game configuration
export const GAME_CONFIG = {
  MAX_MAG_AMMO: 10,
  MOVE_SPEED: 10,
  ROTATION_SPEED: 2,
  TARGET_COUNT: 10,
  TARGET_HP: 5,
  TARGET_SPACING: 10,
  TARGET_SCALE: 0.08,
  TARGET_POSITION: { x: -45, y: 0, z: -50 },
  GROUND_SIZE: 100,
  CAMERA_HEIGHT: 20,
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  WEAPON_SCALE: 0.15,
  WEAPON_Y_OFFSET: -24.5,
  WEAPON_Z_OFFSET: -2.5,
  WEAPON_Y_ROTATION: Math.PI * 1.05,
  WEAPON_X_ROTATION: -Math.PI * 0.02,
  PITCH_CLAMP: Math.PI / 2,
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
  DEFAULT_FPS: 30,
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
