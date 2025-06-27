import * as THREE from 'three';

// Import FBX and PNG as base64 strings
import mergedFBXBase64 from '../assets/sk_vortex_without_animation_merged.fbx';
import mergedAnimFBXBase64 from '../assets/sk_vortex_only_animation_merged.fbx';
import dummyTargetFBXBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import { EventBus } from './classes/EventBus';
import { AssetLoader } from './classes/AssetLoader';
import { Joystick } from './classes/Joystick';
import { CENTER, X_AXIS_VECTOR } from './helpers/constants';
import { PlayerController } from './classes/PlayerController';
import { TargetController } from './classes/TargetController';
import { GameUIOverlay } from './classes/GameUIOverlay';
import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
} from './helpers/EventNames';

let isGameOver = false;
let enableDebug = false;

const androidAppLink =
  'https://play.google.com/store/apps/details?id=com.polygon.arena&hl=en';
const iosAppLink =
  'https://apps.apple.com/us/app/polygun-arena-online-shooter/id64510407809';
const rotationState = { yaw: 0, pitch: 0 };
const eventBus = new EventBus();
eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
  isGameOver = false;
  rotationState.yaw = 0;
  rotationState.pitch = 0;
});
const gameUIOverlay = new GameUIOverlay(eventBus, androidAppLink, iosAppLink);

// raycaster
const raycaster = new THREE.Raycaster();

// clock
const clock = new THREE.Clock();

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color().setRGB(0.5, 0.7, 0.5);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.FrontSide,
  })
);
ground.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.5);
scene.add(ground);

// joysticks
const moveJoystick = new Joystick(eventBus, true);
const rotateJoystick = new Joystick(eventBus, false);

// asset loader
const assetLoader = new AssetLoader();
let playerController;
assetLoader.loadCompleteCallback = () => {
  playerController = new PlayerController(
    scene,
    assetLoader.getFBX('mergedFBXBase64'),
    assetLoader.getFBX('mergedAnimFBXBase64'),
    enableDebug,
    renderer,
    raycaster,
    eventBus
  );

  const targetController = new TargetController(
    scene,
    assetLoader.getFBX('dummyTargetFBXBase64'),
    10,
    eventBus
  );

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    playerController.updateMixer(delta);
    if (isGameOver) return;
    const camera = playerController.getCamera();

    // ROTATION: right joystick controls yaw/pitch
    rotationState.yaw -= rotateJoystick.joystickInput.x * delta * 2; // rotate horizontally
    rotationState.pitch -= rotateJoystick.joystickInput.y * delta * 2; // rotate vertically
    rotationState.pitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotationState.pitch)
    ); // clamp

    // Movement: based on joystick (left)
    const direction = new THREE.Vector3(
      moveJoystick.joystickInput.x,
      0,
      moveJoystick.joystickInput.y
    );

    playerController.update(direction, rotationState, delta);

    // check hit
    if (playerController.isWeaponReady()) {
      raycaster.setFromCamera(CENTER, camera);
      const intersects = raycaster.intersectObjects(
        targetController.getTargets(),
        true
      );

      if (intersects.length > 0) {
        const firstHit = intersects[0];
        if (firstHit.object.parent.visible) {
          isGameOver = targetController.onHit(firstHit.object.parent);
          if (isGameOver) {
            eventBus.emit(GAME_OVER_EVENT_NAME);
          }
          playerController.fireWeapon();
          gameUIOverlay.showHitMarker();
        }
      }
    }

    // main FPS view
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }
  animate();
};
assetLoader.loadFBX('mergedFBXBase64', mergedFBXBase64);
assetLoader.loadFBX('mergedAnimFBXBase64', mergedAnimFBXBase64);
assetLoader.loadFBX('dummyTargetFBXBase64', dummyTargetFBXBase64);

window.addEventListener('resize', () => {
  if (!playerController) return;
  const camera = playerController.getCamera();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  moveJoystick.resize();
});
