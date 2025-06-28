import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.setupRenderer();
    this.setupResizeHandler();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setPixelRatio(1); // For mobile devices, it is better for performance to set pixel ratio to 1
    document.body.appendChild(this.renderer.domElement);
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Notify other components about resize
    if (this.onResizeCallback) {
      this.onResizeCallback();
    }
  }

  setOnResizeCallback(callback) {
    this.onResizeCallback = callback;
  }

  render(scene, camera) {
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.render(scene, camera);
  }

  getRenderer() {
    return this.renderer;
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  updateCameraAspect(camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
