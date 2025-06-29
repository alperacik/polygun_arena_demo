/**
 * @fileoverview AssetLoader class for loading and managing game assets including FBX models and textures.
 * Handles base64 encoded assets and provides a centralized asset management system.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { base64ToArrayBuffer } from '../helpers/utils';

/**
 * AssetLoader class for managing game assets with Three.js loaders
 * Handles FBX models and textures with base64 encoding support
 */
export class AssetLoader {
  /**
   * Creates a new AssetLoader instance with Three.js loading managers
   * @constructor
   */
  constructor() {
    /** @type {Map<string, THREE.Texture>} Map of loaded textures by key */
    this.textureLoadedMap = new Map();
    /** @type {Map<string, THREE.Group>} Map of loaded FBX models by key */
    this.fbxLoadedMap = new Map();

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      if (url.endsWith('.tga')) {
        console.warn('Blocked FBX texture:', url);
        return ''; // return empty string to block load
      }
      return url;
    });

    manager.onLoad = () => {
      this.loadCompleteCallback();
    };

    /** @type {FBXLoader} FBX loader instance with custom manager */
    this.fbxLoader = new FBXLoader(manager);
    /** @type {THREE.TextureLoader} Texture loader instance with custom manager */
    this.textureLoader = new THREE.TextureLoader(manager);
  }

  /**
   * Load a texture from base64 data and store it with the given key
   * @param {string} key - Unique identifier for the texture
   * @param {string} base64 - Base64 encoded texture data
   */
  loadTexture(key, base64) {
    const texture = this.textureLoader.load(base64);
    this.textureLoadedMap.set(key, texture);
  }

  /**
   * Load an FBX model from base64 data and store it with the given key
   * @param {string} key - Unique identifier for the FBX model
   * @param {string} base64 - Base64 encoded FBX data
   */
  loadFBX(key, base64) {
    const arrayBuffer = base64ToArrayBuffer(base64);
    const obj = this.fbxLoader.parse(arrayBuffer);
    this.fbxLoadedMap.set(key, obj);
  }

  /**
   * Retrieve a loaded FBX model by key
   * @param {string} key - Unique identifier for the FBX model
   * @returns {THREE.Group} The loaded FBX model
   * @throws {string} Error if FBX model doesn't exist with the given key
   */
  getFBX(key) {
    if (this.fbxLoadedMap.has(key)) {
      return this.fbxLoadedMap.get(key);
    }
    throw 'FBX DOES NOT EXIST WITH GIVEN KEY: ' + key;
  }

  /**
   * Retrieve a loaded texture by key
   * @param {string} key - Unique identifier for the texture
   * @returns {THREE.Texture} The loaded texture
   * @throws {string} Error if texture doesn't exist with the given key
   */
  getTexture(key) {
    if (this.textureLoadedMap.has(key)) {
      return this.textureLoadedMap.get(key);
    }
    throw 'TEXTURE DOES NOT EXIST WITH GIVEN KEY: ' + key;
  }
}
