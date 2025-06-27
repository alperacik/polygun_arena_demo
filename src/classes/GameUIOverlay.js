import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
} from '../helpers/EventNames';

export class GameUIOverlay {
  constructor(eventBus, androidAppLink, iosAppLink) {
    this.eventBus = eventBus;
    this.androidAppLink = androidAppLink;
    this.iosAppLink = iosAppLink;
    this.createCrosshair();
    this.createHitMarker();
    this.createOverlay();

    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      this.showGameOverOverlay();
    });
  }

  // ==== Crosshair ====
  createCrosshair() {
    const ch = document.createElement('div');
    Object.assign(ch.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '2vh',
      height: '2vh',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '9999',
    });

    const h = document.createElement('div');
    Object.assign(h.style, {
      position: 'absolute',
      top: '50%',
      left: '0',
      width: '100%',
      height: '0.2vh',
      background: 'red',
      transform: 'translateY(-50%)',
    });

    const v = document.createElement('div');
    Object.assign(v.style, {
      position: 'absolute',
      top: '0',
      left: '50%',
      width: '0.2vh',
      height: '100%',
      background: 'red',
      transform: 'translateX(-50%)',
    });

    ch.appendChild(h);
    ch.appendChild(v);
    document.body.appendChild(ch);
  }

  // ==== Hit Marker ====
  createHitMarker() {
    this.hitMarker = document.createElement('div');
    Object.assign(this.hitMarker.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '6vh',
      height: '6vh',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.3s ease-out',
    });

    const lineLen = '2vh';
    const gap = '1vh';
    const thickness = '0.2vh';

    const makeLine = (rot, x, y, origin) => {
      const line = document.createElement('div');
      Object.assign(line.style, {
        position: 'absolute',
        width: lineLen,
        height: thickness,
        background: 'yellow',
        transform: `rotate(${rot}deg)`,
        transformOrigin: origin,
      });
      line.style[x] = gap;
      line.style[y] = gap;
      return line;
    };

    this.hitMarker.appendChild(makeLine(45, 'left', 'top', 'left center'));
    this.hitMarker.appendChild(makeLine(45, 'right', 'bottom', 'right center'));
    this.hitMarker.appendChild(makeLine(-45, 'right', 'top', 'right center'));
    this.hitMarker.appendChild(makeLine(-45, 'left', 'bottom', 'left center'));

    document.body.appendChild(this.hitMarker);
  }

  showHitMarker() {
    this.hitMarker.style.opacity = '1';
    setTimeout(() => {
      this.hitMarker.style.opacity = '0';
    }, 300);
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
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10001',
      pointerEvents: 'auto',
      visibility: 'hidden',
    });

    const buttonWrapper = document.createElement('div');
    Object.assign(buttonWrapper.style, {
      display: 'flex',
      flexDirection: 'row',
      gap: '2vh',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    });

    const createBtn = (label, handler) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        padding: '2vh 4vh',
        fontSize: '2.2vh',
        borderRadius: '1vh',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: '#fff',
        color: '#000',
        fontWeight: 'bold',
        boxShadow: '0 0.5vh 1vh rgba(0,0,0,0.3)',
        minWidth: '20vh',
        touchAction: 'manipulation',
      });
      btn.addEventListener(
        'mouseenter',
        () => (btn.style.backgroundColor = '#eee')
      );
      btn.addEventListener(
        'mouseleave',
        () => (btn.style.backgroundColor = '#fff')
      );
      btn.addEventListener('click', handler);
      return btn;
    };

    const playAgainBtn = createBtn('🔁 Play Again', () => {
      this.hideGameOverOverlay();
      this.eventBus.emit(PLAY_AGAIN_EVENT_NAME);
    });

    const downloadBtn = createBtn('⬇️ Download', () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/android/i.test(userAgent)) {
        // Redirect to Google Play Store
        window.open(this.androidAppLink);
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        // Redirect to Apple App Store
        window.open(this.iosAppLink);
      } else {
        // Optional fallback for other devices (desktop, unknown)
        window.open(this.androidAppLink);
      }
    });

    buttonWrapper.appendChild(playAgainBtn);
    buttonWrapper.appendChild(downloadBtn);
    this.overlay.appendChild(buttonWrapper);
    document.body.appendChild(this.overlay);
  }

  showGameOverOverlay() {
    this.overlay.style.visibility = 'visible';
  }

  hideGameOverOverlay() {
    this.overlay.style.visibility = 'hidden';
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
}
