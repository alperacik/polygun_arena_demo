import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// Import FBX and PNG as base64 strings
import mergedFBXBase64 from '../assets/sk_vortex_without_animation_merged.fbx';
import mergedAnimFBXBase64 from '../assets/sk_vortex_only_animation_merged.fbx';
import dummyTargetFBXBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import { AssetLoader } from './classes/AssetLoader';
import { detectFPS } from './helpers/utils';
import { Joystick } from './classes/Joystick';

let enableDebug = false;
const X_AXIS_VECTOR = new THREE.Vector3(1, 0, 0);
const Y_AXIS_VECTOR = new THREE.Vector3(0, 1, 0);
const Z_AXIS_VECTOR = new THREE.Vector3(0, 0, 1);

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color().setRGB(0.5, 0.7, 0.5);

const player = new THREE.Object3D(); // Player container (holds cam & weapon)
scene.add(player);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 20, 0); // height of eyes from ground
player.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Plane geometry and material
const geometry = new THREE.PlaneGeometry(100, 100); // width, height
const material = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  side: THREE.FrontSide,
});
const ground = new THREE.Mesh(geometry, material);
ground.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.5);

scene.add(ground);

let controls;
let mergedObj;
const moveJoystick = new Joystick(true);
const rotateJoystick = new Joystick(false);
const assetLoader = new AssetLoader();
assetLoader.loadCompleteCallback = () => {
  mergedObj = assetLoader.getFBX('mergedFBXBase64');
  const mergedAnimObj = assetLoader.getFBX('mergedAnimFBXBase64');

  mergedObj.rotateOnAxis(Y_AXIS_VECTOR, Math.PI); // y axis
  mergedObj.rotateOnAxis(X_AXIS_VECTOR, -Math.PI * 0.01); // x axis
  mergedObj.rotateOnAxis(Z_AXIS_VECTOR, Math.PI * 0.1); // z axis
  mergedObj.position.y -= 24.5;
  mergedObj.position.x -= 6;
  mergedObj.position.z -= 3;
  const scale = 0.15;
  mergedObj.scale.set(scale, scale, scale);

  const weaponMixer = new THREE.AnimationMixer(mergedObj);
  const clip = mergedAnimObj.animations[0];
  console.log(clip);
  const fps = clip.frameRate ?? detectFPS(clip);
  console.log(fps);
  const deployClip = THREE.AnimationUtils.subclip(clip, 'Deploy', 0, 29, fps);
  const idleClip = THREE.AnimationUtils.subclip(clip, 'Idle', 30, 31, fps);
  const fireClip = THREE.AnimationUtils.subclip(clip, 'Fire', 32, 56, fps);
  const reloadClip = THREE.AnimationUtils.subclip(clip, 'Reload', 58, 127, fps);
  if (clip) {
    const action = weaponMixer.clipAction(idleClip);
    action.play();
  }
  camera.add(mergedObj);

  // Use orbit controls to inspect the scene
  let fpsHelper;
  if (enableDebug) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    fpsHelper = new THREE.CameraHelper(camera);
    scene.add(fpsHelper);
  }

  const dummyTargetObjExample = assetLoader.getFBX('dummyTargetFBXBase64');
  dummyTargetObjExample.scale.set(0.15, 0.15, 0.15);
  scene.add(dummyTargetObjExample);

  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  const rotation = { yaw: 0, pitch: 0 }; // camera rotation state
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (weaponMixer) weaponMixer.update(delta);

    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(
      [dummyTargetObjExample],
      true
    );

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      console.log(
        'Hit:',
        firstHit.object.name || firstHit.object,
        firstHit.point
      );
    }

    // ROTATION: right joystick controls yaw/pitch
    rotation.yaw -= rotateJoystick.joystickInput.x * delta * 2; // rotate horizontally
    rotation.pitch -= rotateJoystick.joystickInput.y * delta * 2; // rotate vertically
    rotation.pitch = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotation.pitch)
    ); // clamp

    // Rotation: based on invisible joystick (right)
    player.rotation.y = rotation.yaw;
    camera.rotation.x = rotation.pitch;
    const moveSpeed = 10;
    // Movement: based on joystick (left)
    const dir = new THREE.Vector3(
      moveJoystick.joystickInput.x,
      0,
      moveJoystick.joystickInput.y
    );
    if (dir.lengthSq() > 0) {
      dir.normalize().applyAxisAngle(Y_AXIS_VECTOR, rotation.yaw);
      dir.multiplyScalar(moveSpeed * delta);
      player.position.add(dir);
    }

    // update your game logic, controls, joysticks …
    if (enableDebug) {
      controls.update();
      fpsHelper.update();
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  moveJoystick.resize();
});
