/**
 * @fileoverview Joystick class providing touch and pointer input handling for mobile and desktop devices.
 * Manages virtual joystick controls with automatic input mode detection and responsive design.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
} from '../helpers/EventNames';
import { JOYSTICK_CONFIG, COLORS } from '../helpers/constants';

/**
 * Joystick class for handling touch and pointer input with automatic mode detection
 * Provides virtual joystick controls that adapt to different input devices and screen sizes
 */
export class Joystick {
  /**
   * Creates a new Joystick instance with event bus and visibility settings
   * @param {EventBus} eventBus - Event bus for game communication
   * @param {boolean} isVisible - Whether the joystick should be visually rendered
   * @constructor
   */
  constructor(eventBus, isVisible) {
    /** @type {EventBus} Event bus for game communication */
    this.eventBus = eventBus;
    /** @type {boolean} Flag indicating if joystick should be visually rendered */
    this.isVisible = isVisible;
    /** @type {Object} Current joystick input values {x, y} */
    this.joystickInput = { x: 0, y: 0 };
    /** @type {Object} Origin position of the joystick {x, y} */
    this.origin = { x: 0, y: 0 };
    /** @type {boolean} Flag indicating if joystick is currently active */
    this.active = false;
    /** @type {Array} Array of touch event listener names */
    this.touchListeners = [];
    /** @type {Array} Array of pointer event listener names */
    this.pointerListeners = [];

    this.calculateSizes();
    this.setupJoystick();
    this.setupEventListeners();
  }

  /**
   * Calculates joystick dimensions based on screen size and configuration
   * Sets base size, stick size, and maximum radius for joystick movement
   */
  calculateSizes() {
    const shortEdge = Math.min(window.innerWidth, window.innerHeight);
    /** @type {number} Base size of the joystick */
    this.baseSize = shortEdge * JOYSTICK_CONFIG.BASE_SIZE_RATIO;
    /** @type {number} Size of the joystick stick */
    this.stickSize = this.baseSize * JOYSTICK_CONFIG.STICK_SIZE_RATIO;
    /** @type {number} Maximum radius for joystick movement */
    this.maxRadius = this.baseSize * JOYSTICK_CONFIG.MAX_RADIUS_RATIO;
  }

  /**
   * Sets up the joystick based on visibility requirements
   * Initializes visual elements if joystick should be visible
   */
  setupJoystick() {
    if (this.isVisible) {
      this.initVisibleJoystick();
    }
  }

  /**
   * Sets up event listeners for pointer and touch input
   * Configures automatic input mode detection and game state handling
   */
  setupEventListeners() {
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    // Set up both event types but manage them dynamically
    this.setupPointerEvents();
    this.setupTouchEvents();

    // Use a more reliable detection method
    this.updateEventMode();

    // Add resize listener to update event mode when viewport changes
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    /** @type {boolean} Flag indicating if game is over */
    this.isGameOver = false;

    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.isGameOver = true;
      this.resetJoystick();
    });

    this.eventBus.on(PLAY_AGAIN_EVENT_NAME, () => {
      this.isGameOver = false;
    });
  }

  /**
   * Sets up pointer event listeners for desktop input
   * Configures pointerdown, pointermove, and pointerup events
   */
  setupPointerEvents() {
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.pointerListeners = ['pointerdown', 'pointermove', 'pointerup'];
  }

  /**
   * Sets up touch event listeners for mobile input
   * Configures touchstart, touchmove, touchend, and touchcancel events
   */
  setupTouchEvents() {
    window.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener('touchend', this.handleTouchEnd, {
      passive: false,
    });
    window.addEventListener('touchcancel', this.handleTouchEnd, {
      passive: false,
    });
    this.touchListeners = [
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
    ];
  }

  /**
   * Updates the event mode based on current device capabilities
   * Switches between pointer and touch events based on input detection
   */
  updateEventMode() {
    const shouldUseTouch = this.shouldUseTouchEvents();

    if (shouldUseTouch) {
      this.disablePointerEvents();
      this.enableTouchEvents();
    } else {
      this.disableTouchEvents();
      this.enablePointerEvents();
    }
  }

  /**
   * Determines if touch events should be used based on device capabilities
   * @returns {boolean} True if touch events should be used, false for pointer events
   */
  shouldUseTouchEvents() {
    // Simplified and more reliable touch detection
    // Focus on actual input capabilities rather than device simulation

    // Check if the device actually supports touch
    const hasTouchSupport =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check if we're in a mobile viewport (most reliable indicator)
    const isMobileViewport = window.innerWidth <= 768;

    // Check if the primary input is touch-based
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasNoHover = window.matchMedia('(hover: none)').matches;

    // Use touch events if we have touch support AND we're in a mobile-like environment
    const shouldUseTouch =
      hasTouchSupport && (isMobileViewport || hasCoarsePointer || hasNoHover);

    return shouldUseTouch;
  }

  /**
   * Enables pointer events and disables touch events
   */
  enablePointerEvents() {
    this.pointerEventsEnabled = true;
    this.touchEventsEnabled = false;
  }

  /**
   * Disables pointer events
   */
  disablePointerEvents() {
    this.pointerEventsEnabled = false;
  }

  /**
   * Enables touch events and disables pointer events
   */
  enableTouchEvents() {
    this.touchEventsEnabled = true;
    this.pointerEventsEnabled = false;
  }

  /**
   * Disables touch events
   */
  disableTouchEvents() {
    this.touchEventsEnabled = false;
  }

  /**
   * Handles pointer down events for desktop input
   * @param {PointerEvent} e - Pointer event object
   */
  handlePointerDown(e) {
    if (!this.pointerEventsEnabled) return;
    this.startJoystick(e.clientX, e.clientY);
  }

  /**
   * Handles pointer move events for desktop input
   * @param {PointerEvent} e - Pointer event object
   */
  handlePointerMove(e) {
    if (!this.active || !this.pointerEventsEnabled) return;
    this.updateJoystickPosition(e.clientX, e.clientY);
  }

  /**
   * Handles pointer up events for desktop input
   */
  handlePointerUp() {
    if (!this.pointerEventsEnabled) return;
    this.resetJoystick();
  }

  /**
   * Handles touch start events for mobile input
   * @param {TouchEvent} e - Touch event object
   */
  handleTouchStart(e) {
    if (!this.touchEventsEnabled) return;

    e.preventDefault();
    if (e.touches.length !== 1) return; // Only handle single touch

    const touch = e.touches[0];
    this.startJoystick(touch.clientX, touch.clientY);
  }

  /**
   * Handles touch move events for mobile input
   * @param {TouchEvent} e - Touch event object
   */
  handleTouchMove(e) {
    if (!this.active || !this.touchEventsEnabled) return;

    e.preventDefault();
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }

  /**
   * Handles touch end events for mobile input
   * @param {TouchEvent} e - Touch event object
   */
  handleTouchEnd(e) {
    if (!this.touchEventsEnabled) return;
    e.preventDefault();
    this.resetJoystick();
  }

  /**
   * Starts joystick interaction at the specified coordinates
   * @param {number} clientX - X coordinate of the input event
   * @param {number} clientY - Y coordinate of the input event
   */
  startJoystick(clientX, clientY) {
    if (this.isGameOver) return;

    if (this.isVisible) {
      if (clientX > window.innerWidth / 2) return; // Only left half allowed
    } else {
      if (clientX <= window.innerWidth / 2) return; // Only right half allowed
    }

    this.active = true;
    this.origin = { x: clientX, y: clientY };

    if (this.isVisible) {
      this.showJoystick();
    }
  }

  /**
   * Resets joystick state to inactive and clears input values
   */
  resetJoystick() {
    this.active = false;
    this.joystickInput = { x: 0, y: 0 };

    if (this.isVisible) {
      this.hideJoystick();
    }
  }

  /**
   * Updates joystick position and calculates input values
   * @param {number} clientX - X coordinate of the input event
   * @param {number} clientY - Y coordinate of the input event
   */
  updateJoystickPosition(clientX, clientY) {
    if (this.isGameOver) return;

    const dx = clientX - this.origin.x;
    const dy = clientY - this.origin.y;

    const distance = Math.min(Math.hypot(dx, dy), this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    this.joystickInput.x = offsetX / this.maxRadius;
    this.joystickInput.y = offsetY / this.maxRadius;

    if (this.isVisible) {
      this.updateStickPosition(offsetX, offsetY);
    } else {
      // prevent joystick from moving when not visible
      this.origin = { x: clientX, y: clientY };
    }
  }

  /**
   * Resets joystick input values to zero
   */
  resetJoystickInput() {
    this.joystickInput = { x: 0, y: 0 };
  }

  /**
   * Shows the visible joystick at the origin position
   */
  showJoystick() {
    this.baseEl.style.left = `${this.origin.x}px`;
    this.baseEl.style.top = `${this.origin.y}px`;
    this.baseEl.classList.remove('hidden');
    this.centerStick();
    // Enable pointer events when joystick is visible
    this.container.style.pointerEvents = 'auto';
  }

  /**
   * Hides the visible joystick and centers the stick
   */
  hideJoystick() {
    this.baseEl.classList.add('hidden');
    this.centerStick();
    // Disable pointer events when joystick is hidden
    this.container.style.pointerEvents = 'none';
  }

  /**
   * Centers the joystick stick at the origin position
   */
  centerStick() {
    this.stickEl.style.transform = 'translate(-50%, -50%)';
  }

  /**
   * Updates the stick position based on input offset
   * @param {number} offsetX - X offset from origin
   * @param {number} offsetY - Y offset from origin
   */
  updateStickPosition(offsetX, offsetY) {
    this.stickEl.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

  /**
   * Initializes the visible joystick elements and styles
   */
  initVisibleJoystick() {
    this.createStyles();
    this.createElements();
  }

  /**
   * Creates CSS styles for the joystick elements
   */
  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
    #joy-container{
      position:fixed; inset:0; touch-action:none; z-index:999; pointer-events: none;
    }
    .joy-base{
      position:absolute; 
      width: ${this.baseSize}px;
      height: ${this.baseSize}px;
      border-radius:50%;
      background:${COLORS.JOYSTICK_BASE}; 
      transform:translate(-50%,-50%);
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    .joy-stick{
      position:absolute;
      width: ${this.stickSize}px;
      height: ${this.stickSize}px;
      border-radius:50%;
      background:${COLORS.JOYSTICK_STICK}; left:50%; top:50%;
      transform:translate(-50%,-50%); transition:transform ${JOYSTICK_CONFIG.TRANSITION_DURATION} linear;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    .hidden{display:none;}
  `;
    document.head.appendChild(style);
  }

  /**
   * Creates DOM elements for the visible joystick
   */
  createElements() {
    /** @type {HTMLElement} Main joystick container */
    this.container = document.createElement('div');
    this.container.id = 'joy-container';

    /** @type {HTMLElement} Joystick base element */
    this.baseEl = document.createElement('div');
    this.baseEl.className = 'joy-base hidden';

    /** @type {HTMLElement} Joystick stick element */
    this.stickEl = document.createElement('div');
    this.stickEl.className = 'joy-stick';

    this.baseEl.appendChild(this.stickEl);
    this.container.appendChild(this.baseEl);
    document.body.appendChild(this.container);
  }

  /**
   * Sets the visibility of the joystick container
   * @param {boolean} value - Whether the container should be visible
   */
  setContainerVisibility(value) {
    this.container.style.visibility = value ? 'visible' : 'hidden';
  }

  /**
   * Handles window resize events and updates joystick dimensions
   */
  resize() {
    this.calculateSizes();

    if (!this.isVisible) return;

    // Apply new styles
    this.baseEl.style.width = `${this.baseSize}px`;
    this.baseEl.style.height = `${this.baseSize}px`;
    this.stickEl.style.width = `${this.stickSize}px`;
    this.stickEl.style.height = `${this.stickSize}px`;

    // Update event mode on resize
    this.updateEventMode();
  }

  /**
   * Destroys the joystick and cleans up all event listeners
   */
  destroy() {
    // Remove event listeners
    this.pointerListeners.forEach((eventType) => {
      window.removeEventListener(
        eventType,
        this[`handle${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`]
      );
    });

    this.touchListeners.forEach((eventType) => {
      window.removeEventListener(
        eventType,
        this[`handle${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`]
      );
    });

    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Remove DOM elements
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // Remove styles
    const styleElement = document.querySelector('style');
    if (styleElement && styleElement.textContent.includes('#joy-container')) {
      styleElement.remove();
    }
  }

  /**
   * Handles window resize events and updates joystick configuration
   */
  handleResize() {
    // Recalculate sizes
    this.calculateSizes();

    // Update visible joystick if needed
    if (this.isVisible && this.baseEl) {
      this.baseEl.style.width = `${this.baseSize}px`;
      this.baseEl.style.height = `${this.baseSize}px`;
      this.stickEl.style.width = `${this.stickSize}px`;
      this.stickEl.style.height = `${this.stickSize}px`;
    }

    // Update event mode
    this.updateEventMode();
  }

  /**
   * Refreshes the event mode detection and switches if necessary
   */
  refreshEventMode() {
    this.updateEventMode();
  }
}
