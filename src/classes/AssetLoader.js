import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { base64ToArrayBuffer } from '../helpers/utils';

export class AssetLoader {
  constructor() {
    this.textureLoadedMap = new Map();
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

    this.fbxLoader = new FBXLoader(manager);
    this.textureLoader = new THREE.TextureLoader(manager);
  }

  loadTexture(key, base64) {
    const texture = this.textureLoader.load(base64);
    this.textureLoadedMap.set(key, texture);
  }

  loadFBX(key, base64) {
    const arrayBuffer = base64ToArrayBuffer(base64);
    const object = this.fbxLoader.parse(arrayBuffer);
    this.fbxLoadedMap.set(key, object);
  }

  getFBX(key) {
    if (this.fbxLoadedMap.has(key)) {
      return this.fbxLoadedMap.get(key);
    }
    throw 'FBX DOES NOT EXIST WITH GIVEN KEY: ' + key;
  }

  getTexture(key) {
    if (this.textureLoadedMap.has(key)) {
      return this.textureLoadedMap.get(key);
    }
    throw 'TEXTURE DOES NOT EXIST WITH GIVEN KEY: ' + key;
  }
}
