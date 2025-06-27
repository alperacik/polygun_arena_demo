// Import FBX assets as base64 strings
import mergedFBXBase64 from '../assets/sk_vortex_without_animation_merged.fbx';
import mergedAnimFBXBase64 from '../assets/sk_vortex_only_animation_merged.fbx';
import dummyTargetFBXBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import { GameManager } from './classes/GameManager';

// Configuration
const enableDebug = false;

// Initialize game
const gameManager = new GameManager(enableDebug);

// Load assets
const assets = {
  mergedFBXBase64,
  mergedAnimFBXBase64,
  dummyTargetFBXBase64,
};

gameManager.loadAssets(assets);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  gameManager.dispose();
});
