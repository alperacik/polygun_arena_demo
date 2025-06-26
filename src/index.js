import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// Import FBX and PNG as base64 strings
import mergedFBXBase64 from '../assets/sk_vortex_without_animation_merged.fbx';
import mergedAnimFBXBase64 from '../assets/sk_vortex_only_animation_merged.fbx';
// import fbxBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import { AssetLoader } from './classes/AssetLoader';
import { detectFPS } from './helpers/utils';
import { Joystick } from './classes/Joystick';

let enableDebug = false;

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color().setRGB(0.5, 0.7, 0.5);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cube.position.set(0, 0, -5); // 5 units in front of the camera

let controls;
let mergedObj;
const moveJoystick = new Joystick(true);
const rotateJoystick = new Joystick(false);
const assetLoader = new AssetLoader();
assetLoader.loadCompleteCallback = () => {
  mergedObj = assetLoader.getFBX('mergedFBXBase64');
  const mergedAnimObj = assetLoader.getFBX('mergedAnimFBXBase64');
  console.log({ mergedAnimObj });

  mergedObj.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI); // y axis
  mergedObj.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI * 0.01); // x axis
  mergedObj.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI * 0.1); // z axis
  mergedObj.position.y -= 24.5;
  mergedObj.position.x -= 6;
  mergedObj.position.z -= 3;
  const scale = 0.15;
  mergedObj.scale.set(scale, scale, scale);

  const playerGroup = new THREE.Group();
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

  playerGroup.add(mergedObj);
  camera.add(playerGroup);

  // Use orbit controls to inspect the scene
  let fpsHelper;
  if (enableDebug) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    fpsHelper = new THREE.CameraHelper(camera);
    scene.add(fpsHelper);
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (weaponMixer) weaponMixer.update(delta);
    const moveSpeed = 0.1;
    // Movement: based on joystick (left)
    const move = new THREE.Vector3(
      moveJoystick.joystickInput.x,
      0,
      moveJoystick.joystickInput.y
    );
    move.normalize().multiplyScalar(moveSpeed);
    camera.position.add(move);

    // Rotation: based on invisible joystick (right)
    camera.rotation.y -= rotateJoystick.joystickInput.x * 0.02; // horizontal drag
    camera.rotation.x -= rotateJoystick.joystickInput.y * 0.02; // vertical drag

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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  moveJoystick.resize();
});
