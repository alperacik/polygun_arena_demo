import * as THREE from 'three';

// Import FBX and PNG as base64 strings
// import fbxBase64 from '../assets/character/sk_char_sergeant_arms_fp.fbx';
import weaponFBXBase64 from '../assets/weapon/sk_primary_vortex_mesh.fbx';
import weaponAnimFBXBase64 from '../assets/weapon/sk_primary_vortex_anim_fp.fbx';
// import fbxBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import weaponPNGBase64 from '../assets/weapon/t_primary_vortex_basecolor.png';
import { AssetLoader } from './classes/AssetLoader';

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

const assetLoader = new AssetLoader();
assetLoader.loadCompleteCallback = () => {
  const weaponObj = assetLoader.getFBX('weapon');
  const weaponTexture = assetLoader.getTexture('weaponTexture');

  weaponObj.traverse((child) => {
    if (child.isMesh) {
      child.material.map = weaponTexture;
      child.material.needsUpdate = true;
    }
  });

  weaponObj.rotation.y += Math.PI * 0.5;
  weaponObj.scale.set(0.1, 0.1, 0.1);

  scene.add(weaponObj);
};
assetLoader.loadFBX('weapon', weaponFBXBase64);
assetLoader.loadFBX('weaponAnim', weaponAnimFBXBase64);
assetLoader.loadTexture('weaponTexture', weaponPNGBase64);

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
