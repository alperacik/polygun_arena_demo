import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
  KILL_COUNT_UPDATE_EVENT_NAME,
} from '../helpers/EventNames';
import {
  UI_CONFIG,
  COLORS,
  APP_LINKS,
  getEffectiveKillCountToWin,
} from '../helpers/constants';

export class GameUIOverlay {
  constructor(eventBus, androidAppLink, iosAppLink) {
    this.eventBus = eventBus;
    this.androidAppLink = androidAppLink || APP_LINKS.ANDROID;
    this.iosAppLink = iosAppLink || APP_LINKS.IOS;

    this.createCrosshair();
    this.createHitMarker();
    this.createKillCounter();
    this.createOverlay();
    this.setupEventListeners();

    // Add window resize listener
    this.resizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  setupEventListeners() {
    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      setTimeout(() => {
        this.showGameOverOverlay();
      }, 500);
    });

    this.eventBus.on(KILL_COUNT_UPDATE_EVENT_NAME, (killCount) => {
      this.updateKillCounter(killCount);
    });
  }

  // ==== Crosshair ====
  createCrosshair() {
    this.crosshair = document.createElement('div');
    Object.assign(this.crosshair.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: UI_CONFIG.CROSSHAIR_SIZE,
      height: UI_CONFIG.CROSSHAIR_SIZE,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '9999',
    });

    const horizontalLine = this.createCrosshairLine('horizontal');
    const verticalLine = this.createCrosshairLine('vertical');

    this.crosshair.appendChild(horizontalLine);
    this.crosshair.appendChild(verticalLine);
    document.body.appendChild(this.crosshair);
  }

  createCrosshairLine(orientation) {
    const line = document.createElement('div');
    const isHorizontal = orientation === 'horizontal';

    Object.assign(line.style, {
      position: 'absolute',
      background: COLORS.CROSSHAIR,
      transform: isHorizontal ? 'translateY(-50%)' : 'translateX(-50%)',
    });

    if (isHorizontal) {
      Object.assign(line.style, {
        top: '50%',
        left: '0',
        width: '100%',
        height: UI_CONFIG.CROSSHAIR_THICKNESS,
      });
    } else {
      Object.assign(line.style, {
        top: '0',
        left: '50%',
        width: UI_CONFIG.CROSSHAIR_THICKNESS,
        height: '100%',
      });
    }

    return line;
  }

  // ==== Hit Marker ====
  createHitMarker() {
    this.hitMarker = document.createElement('div');
    Object.assign(this.hitMarker.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: UI_CONFIG.HIT_MARKER_SIZE,
      height: UI_CONFIG.HIT_MARKER_SIZE,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '10000',
      opacity: '0',
      transition: `opacity ${UI_CONFIG.HIT_MARKER_DURATION}ms ease-out`,
    });

    this.createHitMarkerLines();
    document.body.appendChild(this.hitMarker);
  }

  createHitMarkerLines() {
    const lineConfigs = [
      { rotation: 45, x: 'left', y: 'top', origin: 'left center' },
      { rotation: 45, x: 'right', y: 'bottom', origin: 'right center' },
      { rotation: -45, x: 'right', y: 'top', origin: 'right center' },
      { rotation: -45, x: 'left', y: 'bottom', origin: 'left center' },
    ];

    lineConfigs.forEach((config) => {
      const line = this.createHitMarkerLine(config);
      this.hitMarker.appendChild(line);
    });
  }

  createHitMarkerLine({ rotation, x, y, origin }) {
    const line = document.createElement('div');
    Object.assign(line.style, {
      position: 'absolute',
      width: UI_CONFIG.HIT_MARKER_LINE_LENGTH,
      height: UI_CONFIG.HIT_MARKER_THICKNESS,
      background: COLORS.HIT_MARKER,
      transform: `rotate(${rotation}deg)`,
      transformOrigin: origin,
    });
    line.style[x] = UI_CONFIG.HIT_MARKER_GAP;
    line.style[y] = UI_CONFIG.HIT_MARKER_GAP;
    return line;
  }

  showHitMarker() {
    this.hitMarker.style.opacity = '1';
    setTimeout(() => {
      this.hitMarker.style.opacity = '0';
    }, UI_CONFIG.HIT_MARKER_DURATION);
  }

  // ==== Kill Counter ====
  createKillCounter() {
    this.killCounter = document.createElement('div');
    Object.assign(this.killCounter.style, {
      position: 'fixed',
      top: '2vh',
      left: '2vh',
      padding: '1vh 2vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      fontSize: '2.5vh',
      fontWeight: 'bold',
      borderRadius: '1vh',
      zIndex: '9998',
      pointerEvents: 'none',
      fontFamily: 'Arial, sans-serif',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      border: '2px solid rgba(255,255,255,0.3)',
    });

    this.killCounter.textContent = `Kills: 0/${getEffectiveKillCountToWin()}`;
    document.body.appendChild(this.killCounter);
  }

  updateKillCounter(killCount) {
    this.killCounter.textContent = `Kills: ${killCount}/${getEffectiveKillCountToWin()}`;

    // Add a brief highlight effect when kill count increases
    this.killCounter.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
    this.killCounter.style.color = '#000';
    setTimeout(() => {
      this.killCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.killCounter.style.color = '#fff';
    }, 200);
  }

  // ==== Game Over Overlay ====
  createOverlay() {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: UI_CONFIG.OVERLAY_BACKGROUND,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10001',
      pointerEvents: 'auto',
      visibility: 'hidden',
    });

    const buttonWrapper = this.createButtonWrapper();
    this.overlay.appendChild(buttonWrapper);
    document.body.appendChild(this.overlay);
  }

  createButtonWrapper() {
    const buttonWrapper = document.createElement('div');
    Object.assign(buttonWrapper.style, {
      display: 'flex',
      flexDirection: 'row',
      gap: UI_CONFIG.BUTTON_GAP,
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    });

    const playAgainBtn = this.createButton('🔁 Play Again', () => {
      this.hideGameOverOverlay();
      this.eventBus.emit(PLAY_AGAIN_EVENT_NAME);
    });

    const downloadBtn = this.createButton('⬇️ Download', () => {
      this.handleDownload();
    });

    buttonWrapper.appendChild(playAgainBtn);
    buttonWrapper.appendChild(downloadBtn);
    return buttonWrapper;
  }

  createButton(label, handler) {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: UI_CONFIG.BUTTON_PADDING,
      fontSize: UI_CONFIG.BUTTON_FONT_SIZE,
      borderRadius: UI_CONFIG.BUTTON_BORDER_RADIUS,
      border: 'none',
      cursor: 'pointer',
      backgroundColor: COLORS.BUTTON_BACKGROUND,
      color: COLORS.BUTTON_TEXT,
      fontWeight: 'bold',
      boxShadow: '0 0.5vh 1vh rgba(0,0,0,0.3)',
      minWidth: UI_CONFIG.BUTTON_MIN_WIDTH,
      touchAction: 'manipulation',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = COLORS.BUTTON_HOVER;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = COLORS.BUTTON_BACKGROUND;
    });
    btn.addEventListener('click', handler);

    return btn;
  }

  handleDownload() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
      window.open(this.androidAppLink);
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.open(this.iosAppLink);
    } else {
      window.open(this.androidAppLink);
    }
  }

  showGameOverOverlay() {
    this.overlay.style.visibility = 'visible';
  }

  hideGameOverOverlay() {
    this.overlay.style.visibility = 'hidden';
  }

  resize() {
    // Handle mobile viewport issues where 100vh might not work correctly

    // Update overlay dimensions to use calculated viewport units
    if (this.overlay) {
      this.overlay.style.height = `${window.innerHeight}px`;
      this.overlay.style.width = `${window.innerWidth}px`;
    }

    // Force reflow of viewport units for other elements
    const elements = [this.hitMarker, this.crosshair];

    elements.forEach((element) => {
      if (element && element.style) {
        // Trigger reflow by temporarily changing and restoring a property
        const originalVisibility = element.style.visibility;
        element.style.visibility = 'hidden';
        // Force reflow
        element.offsetHeight;
        element.style.visibility = originalVisibility;
      }
    });
  }

  setDownloadHandler(fn) {
    this.downloadHandler = fn;
  }

  defaultDownloadHandler() {
    const blob = new Blob(['Default result file'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  dispose() {
    // Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);

    // Remove DOM elements
    if (this.crosshair && this.crosshair.parentNode) {
      this.crosshair.parentNode.removeChild(this.crosshair);
    }
    if (this.hitMarker && this.hitMarker.parentNode) {
      this.hitMarker.parentNode.removeChild(this.hitMarker);
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
