import { GAME_OVER_EVENT_NAME } from '../helpers/EventNames';
import { JOYSTICK_CONFIG, COLORS } from '../helpers/constants';

export class Joystick {
  constructor(eventBus, isVisible) {
    this.eventBus = eventBus;
    this.isVisible = isVisible;
    this.joystickInput = { x: 0, y: 0 };
    this.origin = { x: 0, y: 0 };
    this.active = false;
    this.touchListeners = [];
    this.pointerListeners = [];

    this.calculateSizes();
    this.setupJoystick();
    this.setupEventListeners();
  }

  calculateSizes() {
    const shortEdge = Math.min(window.innerWidth, window.innerHeight);
    this.baseSize = shortEdge * JOYSTICK_CONFIG.BASE_SIZE_RATIO;
    this.stickSize = this.baseSize * JOYSTICK_CONFIG.STICK_SIZE_RATIO;
    this.maxRadius = this.baseSize * JOYSTICK_CONFIG.MAX_RADIUS_RATIO;
  }

  setupJoystick() {
    if (this.isVisible) {
      this.initVisibleJoystick();
    }
  }

  setupEventListeners() {
    // Remove console.log statements
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

    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.resetJoystick();
    });
  }

  setupPointerEvents() {
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.pointerListeners = ['pointerdown', 'pointermove', 'pointerup'];
  }

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

  updateEventMode() {
    // Check if we should use touch events based on current viewport
    const shouldUseTouch = this.shouldUseTouchEvents();

    // Debug logging
    console.log('Event mode update:', {
      shouldUseTouch,
      currentPointerEnabled: this.pointerEventsEnabled,
      currentTouchEnabled: this.touchEventsEnabled,
    });

    if (shouldUseTouch) {
      this.disablePointerEvents();
      this.enableTouchEvents();
      console.log('Switched to TOUCH mode');
    } else {
      this.disableTouchEvents();
      this.enablePointerEvents();
      console.log('Switched to POINTER mode');
    }
  }

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

    // Debug logging
    console.log('Touch detection:', {
      hasTouchSupport,
      isMobileViewport,
      hasCoarsePointer,
      hasNoHover,
      shouldUseTouch,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    return shouldUseTouch;
  }

  enablePointerEvents() {
    this.pointerEventsEnabled = true;
    this.touchEventsEnabled = false;
  }

  disablePointerEvents() {
    this.pointerEventsEnabled = false;
  }

  enableTouchEvents() {
    this.touchEventsEnabled = true;
    this.pointerEventsEnabled = false;
  }

  disableTouchEvents() {
    this.touchEventsEnabled = false;
  }

  handlePointerDown(e) {
    if (!this.pointerEventsEnabled) return;
    this.startJoystick(e.clientX, e.clientY);
  }

  handlePointerMove(e) {
    if (!this.active || !this.pointerEventsEnabled) return;
    this.updateJoystickPosition(e.clientX, e.clientY);
  }

  handlePointerUp() {
    if (!this.pointerEventsEnabled) return;
    this.resetJoystick();
  }

  // Touch event handlers for mobile fallback
  handleTouchStart(e) {
    if (!this.touchEventsEnabled) return;

    e.preventDefault();
    if (e.touches.length !== 1) return; // Only handle single touch

    const touch = e.touches[0];
    this.startJoystick(touch.clientX, touch.clientY);
  }

  handleTouchMove(e) {
    if (!this.active || !this.touchEventsEnabled) return;

    e.preventDefault();
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }

  handleTouchEnd(e) {
    if (!this.touchEventsEnabled) return;
    e.preventDefault();
    this.resetJoystick();
  }

  // Shared method for starting joystick interaction
  startJoystick(clientX, clientY) {
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

  // Shared method for resetting joystick state
  resetJoystick() {
    this.active = false;
    this.joystickInput = { x: 0, y: 0 };

    if (this.isVisible) {
      this.hideJoystick();
    }
  }

  // Shared method for updating joystick position
  updateJoystickPosition(clientX, clientY) {
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
    }
  }

  showJoystick() {
    this.baseEl.style.left = `${this.origin.x}px`;
    this.baseEl.style.top = `${this.origin.y}px`;
    this.baseEl.classList.remove('hidden');
    this.centerStick();
    // Enable pointer events when joystick is visible
    this.container.style.pointerEvents = 'auto';
  }

  hideJoystick() {
    this.baseEl.classList.add('hidden');
    this.centerStick();
    // Disable pointer events when joystick is hidden
    this.container.style.pointerEvents = 'none';
  }

  centerStick() {
    this.stickEl.style.transform = 'translate(-50%, -50%)';
  }

  updateStickPosition(offsetX, offsetY) {
    this.stickEl.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

  initVisibleJoystick() {
    this.createStyles();
    this.createElements();
  }

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

  createElements() {
    this.container = document.createElement('div');
    this.container.id = 'joy-container';

    this.baseEl = document.createElement('div');
    this.baseEl.className = 'joy-base hidden';

    this.stickEl = document.createElement('div');
    this.stickEl.className = 'joy-stick';

    this.baseEl.appendChild(this.stickEl);
    this.container.appendChild(this.baseEl);
    document.body.appendChild(this.container);
  }

  setContainerVisibility(value) {
    this.container.style.visibility = value ? 'visible' : 'hidden';
  }

  resize() {
    this.calculateSizes();

    if (!this.isVisible) return;

    // Apply new styles
    this.baseEl.style.width = `${this.baseSize}px`;
    this.baseEl.style.height = `${this.baseSize}px`;

    this.stickEl.style.width = `${this.stickSize}px`;
    this.stickEl.style.height = `${this.stickSize}px`;

    // Update event mode when viewport changes
    this.updateEventMode();
  }

  // Cleanup method to remove event listeners
  destroy() {
    // Remove pointer event listeners
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    // Remove touch event listeners
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);

    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Clear timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  handleResize() {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      // Force a complete re-evaluation of the event mode
      const previousPointerEnabled = this.pointerEventsEnabled;
      const previousTouchEnabled = this.touchEventsEnabled;

      this.updateEventMode();

      // If the mode changed, log it for debugging
      if (
        previousPointerEnabled !== this.pointerEventsEnabled ||
        previousTouchEnabled !== this.touchEventsEnabled
      ) {
        console.log('Event mode changed due to resize:', {
          from: {
            pointer: previousPointerEnabled,
            touch: previousTouchEnabled,
          },
          to: {
            pointer: this.pointerEventsEnabled,
            touch: this.touchEventsEnabled,
          },
        });
      }
    }, 100);
  }

  // Public method to manually refresh event mode
  refreshEventMode() {
    console.log('Manually refreshing event mode...');
    this.updateEventMode();
  }

  // Public method to get current event mode status
  getEventModeStatus() {
    return {
      pointerEnabled: this.pointerEventsEnabled,
      touchEnabled: this.touchEventsEnabled,
      shouldUseTouch: this.shouldUseTouchEvents(),
    };
  }
}
