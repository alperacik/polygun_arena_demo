import { GAME_OVER_EVENT_NAME } from '../helpers/EventNames';
import { JOYSTICK_CONFIG, COLORS } from '../helpers/constants';

export class Joystick {
  constructor(eventBus, isVisible) {
    this.eventBus = eventBus;
    this.isVisible = isVisible;
    this.joystickInput = { x: 0, y: 0 };
    this.origin = { x: 0, y: 0 };
    this.active = false;

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
    window.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    window.addEventListener('pointermove', this.handlePointerMove.bind(this));
    window.addEventListener('pointerup', this.handlePointerUp.bind(this));

    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.handlePointerUp();
    });
  }

  handlePointerDown(e) {
    if (this.isVisible) {
      if (e.clientX > window.innerWidth / 2) return; // Only left half allowed
    } else {
      if (e.clientX <= window.innerWidth / 2) return; // Only right half allowed
    }

    this.active = true;
    this.origin = { x: e.clientX, y: e.clientY };

    if (this.isVisible) {
      this.showJoystick();
    }
  }

  handlePointerMove(e) {
    if (!this.active) return;

    const dx = e.clientX - this.origin.x;
    const dy = e.clientY - this.origin.y;

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

  handlePointerUp() {
    this.active = false;
    this.joystickInput = { x: 0, y: 0 };

    if (this.isVisible) {
      this.hideJoystick();
    }
  }

  showJoystick() {
    this.baseEl.style.left = `${this.origin.x}px`;
    this.baseEl.style.top = `${this.origin.y}px`;
    this.baseEl.classList.remove('hidden');
    this.centerStick();
  }

  hideJoystick() {
    this.baseEl.classList.add('hidden');
    this.centerStick();
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
    }
    .joy-stick{
      position:absolute;
      width: ${this.stickSize}px;
      height: ${this.stickSize}px;
      border-radius:50%;
      background:${COLORS.JOYSTICK_STICK}; left:50%; top:50%;
      transform:translate(-50%,-50%); transition:transform ${JOYSTICK_CONFIG.TRANSITION_DURATION} linear;
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
  }
}
