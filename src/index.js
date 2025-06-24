import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Import FBX and PNG as base64 strings
// import fbxBase64 from '../assets/character/sk_char_sergeant_arms_fp.fbx';
import fbxBase64 from '../assets/weapon/sk_primary_vortex_mesh.fbx';
// import fbxBase64 from '../assets/weapon/sk_primary_vortex_anim_fp.fbx';
// import fbxBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

// import fbxBase64 from '../assets/monkey_embedded_texture.fbx';
import pngBase64 from '../assets/weapon/t_primary_vortex_basecolor.png';
console.log({ fbxBase64 });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Helper: convert base64 string to ArrayBuffer for FBXLoader.parse
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const manager = new THREE.LoadingManager();
manager.setURLModifier((url) => {
  if (url.endsWith('.tga')) {
    console.warn('Blocked FBX texture:', url);
    return ''; // return empty string to block load
  }
  return url;
});

const loader = new FBXLoader(manager);

const arrayBuffer = base64ToArrayBuffer(fbxBase64);
console.log({ arrayBuffer });

const object = loader.parse(arrayBuffer);

const texture = new THREE.TextureLoader().load(pngBase64);

// Assign texture manually to all meshes
object.traverse((child) => {
  if (child.isMesh) {
    child.material.map = texture;
    child.material.needsUpdate = true;
  }
});

object.rotation.y += Math.PI * 0.5;
object.scale.set(0.1, 0.1, 0.1);

scene.add(object);
console.log({ object });

// loader.load('/assets/weapon/sk_primary_vortex_mesh.fbx', (object) => {
//   scene.add(object);
//   console.log(object.scale);
//   object.rotation.y += Math.PI * 0.5;
//   object.scale.set(0.1, 0.1, 0.1);
// });

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
