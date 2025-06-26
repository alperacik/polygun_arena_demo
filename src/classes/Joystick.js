export class Joystick {
  constructor() {
    const shortEdge = Math.min(window.innerWidth, window.innerHeight);
    const baseSize = shortEdge * 0.14;
    const stickSize = baseSize * 0.5;
    this.maxRadius = baseSize * 0.35;
    const style = document.createElement('style');
    style.textContent = `
    #joy-container{
      position:fixed; inset:0; touch-action:none; z-index:999;
    }
    .joy-base{
      position:absolute; 
      width: ${baseSize}px;
      height: ${baseSize}px;
      border-radius:50%;
      background:rgba(100,100,100,.35); 
      transform:translate(-50%,-50%);
    }
    .joy-stick{
      position:absolute;
      width: ${stickSize}px;
      height: ${stickSize}px;
      border-radius:50%;
      background:rgba(255,255,255,.6); left:50%; top:50%;
      transform:translate(-50%,-50%); transition:transform 40ms linear;
    }
    .hidden{display:none;}
  `;
    document.head.appendChild(style);

    this.container = document.createElement('div');
    this.container.id = 'joy-container';

    this.baseEl = document.createElement('div');
    this.baseEl.className = 'joy-base hidden';

    this.stickEl = document.createElement('div');
    this.stickEl.className = 'joy-stick';

    this.baseEl.appendChild(this.stickEl);
    this.container.appendChild(this.baseEl);
    document.body.appendChild(this.container);
    this.joystickInput = { x: 0, y: 0 };
    this.origin = { x: 0, y: 0 };
    this.active = false;

    //  this.container = document.getElementById('joystick-container');
    //  this.baseEl = document.getElementById('joy-base');
    //  this.stickEl = document.getElementById('joy-stick');
    //  this.baseEl.classList.add('hidden');

    this.container.addEventListener('pointerdown', (e) => {
      if (e.clientX > window.innerWidth / 2) return; // Only left half allowed
      this.active = true;
      this.origin = { x: e.clientX, y: e.clientY };
      this.baseEl.style.left = `${this.origin.x}px`;
      this.baseEl.style.top = `${this.origin.y}px`;
      this.baseEl.classList.remove('hidden');

      // centre the stick
      this.stickEl.style.transform = 'translate(-50%, -50%)';

      window.addEventListener('pointermove', this.onMove.bind(this));
      window.addEventListener('pointerup', this.onUp.bind(this));
    });
  }

  setContainerVisibility(value) {
    this.container.style.visibility = value ? 'visible' : 'hidden';
  }

  onMove(e) {
    if (!this.active) return;

    const dx = e.clientX - this.origin.x;
    const dy = e.clientY - this.origin.y;

    const distance = Math.min(Math.hypot(dx, dy), this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    this.stickEl.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;

    this.joystickInput.x = offsetX / this.maxRadius;
    this.joystickInput.y = offsetY / this.maxRadius;
  }

  onUp() {
    this.active = false;
    this.joystickInput = { x: 0, y: 0 };
    // hide & recentre stick
    this.baseEl.classList.add('hidden');
    this.stickEl.style.transform = 'translate(-50%, -50%)';

    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
  }

  resize() {
    const shortEdge = Math.min(window.innerWidth, window.innerHeight);
    const baseSize = shortEdge * 0.14;
    const stickSize = baseSize * 0.5;
    this.maxRadius = baseSize * 0.35;

    // Apply new styles
    this.baseEl.style.width = `${baseSize}px`;
    this.baseEl.style.height = `${baseSize}px`;

    this.stickEl.style.width = `${stickSize}px`;
    this.stickEl.style.height = `${stickSize}px`;
  }
}
