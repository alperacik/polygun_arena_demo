/**
 * @fileoverview Main entry point for the Polygun Arena game application.
 * This file initializes the game manager, loads assets, and sets up cleanup handlers.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

// Import FBX assets as base64 strings
import mergedFBXBase64 from '../assets/sk_vortex_without_animation_merged.fbx';
import mergedAnimFBXBase64 from '../assets/sk_vortex_only_animation_merged.fbx';
import dummyTargetFBXBase64 from '../assets/target_dummy/sk_prop_dummy_mesh.fbx';

import { GameManager } from './classes/GameManager';

/**
 * Debug mode configuration flag
 * @type {boolean}
 */
const enableDebug = false;

/**
 * Main game manager instance
 * @type {GameManager}
 */
const gameManager = new GameManager(enableDebug);

/**
 * Asset configuration object containing all game assets as base64 strings
 * @type {Object.<string, string>}
 */
const assets = {
  mergedFBXBase64,
  mergedAnimFBXBase64,
  dummyTargetFBXBase64,
};

// Load assets into the game manager
gameManager.loadAssets(assets);

/**
 * Cleanup handler for page unload events
 * Ensures proper disposal of game resources when the page is closed
 */
window.addEventListener('beforeunload', () => {
  gameManager.dispose();
});
