import * as THREE from 'three';

// Import FBX and PNG as base64 strings
import mergedFBXBase64 from '../assets/sk_vortex_without_animation_merged.fbx';
import mergedAnimFBXBase64 from '../assets/sk_vortex_only_animation_merged.fbx';
import dummyTargetFBXBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import { AssetLoader } from './classes/AssetLoader';
import { Joystick } from './classes/Joystick';
import { CENTER, X_AXIS_VECTOR } from './helpers/constants';
import { PlayerController } from './classes/PlayerController';
import { TargetController } from './classes/TargetController';

let isGameOver = false;
let enableDebug = false;

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
const moveJoystick = new Joystick(true);
const rotateJoystick = new Joystick(false);

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
    raycaster
  );

  const targetController = new TargetController(
    scene,
    assetLoader.getFBX('dummyTargetFBXBase64'),
    10
  );

  const rotationState = { yaw: 0, pitch: 0 };
  function animate() {
    requestAnimationFrame(animate);
    if (isGameOver) return;
    const camera = playerController.getCamera();
    const delta = clock.getDelta();

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
    raycaster.setFromCamera(CENTER, camera);
    const intersects = raycaster.intersectObjects(
      targetController.getTargets(),
      true
    );

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      isGameOver = targetController.onHit(firstHit.object.parent);
      if (isGameOver) {
        // todo playagain & download buttons
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
