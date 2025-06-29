/**
 * @fileoverview Renderer class for managing Three.js WebGL rendering and window resize handling.
 * Provides a centralized rendering system with automatic resize management.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Renderer class for Three.js WebGL rendering with resize handling
 * Manages the main WebGL renderer and provides utility methods for rendering operations
 */
export class Renderer {
  /**
   * Creates a new Renderer instance and sets up WebGL renderer with resize handling
   * @constructor
   */
  constructor() {
    this.setupRenderer();
    this.setupResizeHandler();
  }

  /**
   * Sets up the Three.js WebGL renderer with optimal settings for mobile devices
   * Creates renderer with antialiasing and appends canvas to document body
   */
  setupRenderer() {
    /** @type {THREE.WebGLRenderer} Main WebGL renderer instance */
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setPixelRatio(1); // For mobile devices, it is better for performance to set pixel ratio to 1
    document.body.appendChild(this.renderer.domElement);
  }

  /**
   * Sets up window resize event listener for responsive rendering
   * Automatically handles viewport and camera aspect ratio updates
   */
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Handles window resize events by updating renderer size and notifying callbacks
   * Updates viewport dimensions and triggers resize callback if set
   */
  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Notify other components about resize
    if (this.onResizeCallback) {
      this.onResizeCallback();
    }
  }

  /**
   * Sets a callback function to be called when window resize occurs
   * @param {Function} callback - Function to call on resize events
   */
  setOnResizeCallback(callback) {
    this.onResizeCallback = callback;
  }

  /**
   * Renders the scene with the specified camera
   * @param {THREE.Scene} scene - The Three.js scene to render
   * @param {THREE.Camera} camera - The camera to render from
   */
  render(scene, camera) {
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.render(scene, camera);
  }

  /**
   * Gets the underlying Three.js WebGL renderer instance
   * @returns {THREE.WebGLRenderer} The WebGL renderer instance
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Updates camera aspect ratio based on current window dimensions
   * @param {THREE.Camera} camera - The camera to update
   */
  updateCameraAspect(camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  /**
   * Disposes of the renderer and cleans up resources
   * Should be called when the renderer is no longer needed
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
