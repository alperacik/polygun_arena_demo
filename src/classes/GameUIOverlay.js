/**
 * @fileoverview GameUIOverlay class managing all user interface elements for the game.
 * Handles crosshair, hit markers, kill counter, game over overlay, and app download buttons.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

import {
  GAME_OVER_EVENT_NAME,
  PLAY_AGAIN_EVENT_NAME,
  KILL_COUNT_UPDATE_EVENT_NAME,
  SHOOTING_EVENT_NAME,
  TARGET_CONFIG_CHANGED_EVENT_NAME,
} from '../helpers/EventNames';
import {
  UI_CONFIG,
  COLORS,
  APP_LINKS,
  getEffectiveKillCountToWin,
} from '../helpers/constants';

/**
 * GameUIOverlay class managing all game user interface elements
 * Provides crosshair, hit markers, kill counter, and game over overlay functionality
 */
export class GameUIOverlay {
  /**
   * Creates a new GameUIOverlay instance with event bus and app links
   * @param {EventBus} eventBus - Event bus for game communication
   * @param {string} [androidAppLink] - Android app store link
   * @param {string} [iosAppLink] - iOS app store link
   * @constructor
   */
  constructor(eventBus, androidAppLink, iosAppLink) {
    /** @type {EventBus} Event bus for game communication */
    this.eventBus = eventBus;
    /** @type {string} Android app store link */
    this.androidAppLink = androidAppLink || APP_LINKS.ANDROID;
    /** @type {string} iOS app store link */
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

  /**
   * Sets up event listeners for game events
   * Handles game over, kill count updates, shooting events, and target configuration changes
   */
  setupEventListeners() {
    this.eventBus.on(GAME_OVER_EVENT_NAME, () => {
      setTimeout(() => {
        this.showGameOverOverlay();
      }, 500);
    });

    this.eventBus.on(KILL_COUNT_UPDATE_EVENT_NAME, (killCount) => {
      this.updateKillCounter(killCount);
    });

    this.eventBus.on(SHOOTING_EVENT_NAME, () => {
      console.log('Shooting event received in GameUIOverlay!');
      this.animateCrosshairSpread();
    });

    // Listen for target configuration changes
    this.eventBus.on(TARGET_CONFIG_CHANGED_EVENT_NAME, (data) => {
      console.log(
        `Target configuration changed to: ${data.configName} (${data.targetCount} targets)`
      );
      // Update the kill counter display to reflect new target count
      this.updateKillCounterDisplay();
    });
  }

  /**
   * Creates the crosshair element with center dot and directional lines
   * Sets up the main crosshair container and its components
   */
  createCrosshair() {
    /** @type {HTMLElement} Main crosshair container element */
    this.crosshair = document.createElement('div');
    Object.assign(this.crosshair.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '6vh',
      height: '6vh',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: '9999',
    });

    // Create center dot
    const centerDot = this.createCrosshairDot();

    // Create 4 lines extending from center
    /** @type {HTMLElement} Top crosshair line */
    this.topLine = this.createCrosshairLine('top');
    /** @type {HTMLElement} Bottom crosshair line */
    this.bottomLine = this.createCrosshairLine('bottom');
    /** @type {HTMLElement} Left crosshair line */
    this.leftLine = this.createCrosshairLine('left');
    /** @type {HTMLElement} Right crosshair line */
    this.rightLine = this.createCrosshairLine('right');

    this.crosshair.appendChild(centerDot);
    this.crosshair.appendChild(this.topLine);
    this.crosshair.appendChild(this.bottomLine);
    this.crosshair.appendChild(this.leftLine);
    this.crosshair.appendChild(this.rightLine);
    document.body.appendChild(this.crosshair);
  }

  /**
   * Creates the center dot element for the crosshair
   * @returns {HTMLElement} The center dot element
   */
  createCrosshairDot() {
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '0.4vh',
      height: '0.4vh',
      background: COLORS.CROSSHAIR,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
    });
    return dot;
  }

  /**
   * Creates a crosshair line element in the specified direction
   * @param {string} direction - Direction of the line ('top', 'bottom', 'left', 'right')
   * @returns {HTMLElement} The crosshair line element
   */
  createCrosshairLine(direction) {
    const line = document.createElement('div');
    const lineLength = '1.2vh'; // Shorter lines for more padding
    const lineGap = '0.8vh'; // Gap from center dot

    Object.assign(line.style, {
      position: 'absolute',
      background: COLORS.CROSSHAIR,
    });

    switch (direction) {
      case 'top':
        Object.assign(line.style, {
          top: '50%',
          left: '50%',
          width: UI_CONFIG.CROSSHAIR_THICKNESS,
          height: lineLength,
          transform: `translate(-50%, calc(-100% - ${lineGap}))`,
        });
        break;
      case 'bottom':
        Object.assign(line.style, {
          top: '50%',
          left: '50%',
          width: UI_CONFIG.CROSSHAIR_THICKNESS,
          height: lineLength,
          transform: `translate(-50%, ${lineGap})`,
        });
        break;
      case 'left':
        Object.assign(line.style, {
          top: '50%',
          left: '50%',
          width: lineLength,
          height: UI_CONFIG.CROSSHAIR_THICKNESS,
          transform: `translate(calc(-100% - ${lineGap}), -50%)`,
        });
        break;
      case 'right':
        Object.assign(line.style, {
          top: '50%',
          left: '50%',
          width: lineLength,
          height: UI_CONFIG.CROSSHAIR_THICKNESS,
          transform: `translate(${lineGap}, -50%)`,
        });
        break;
    }

    return line;
  }

  /**
   * Animates the crosshair spread effect when shooting
   * Triggers recoil animation and line movement animations
   */
  animateCrosshairSpread() {
    console.log('Crosshair spread animation triggered!');

    const spreadDistance = 1.0; // Distance to move lines outward

    // Animate crosshair movement (recoil effect)
    this.animateCrosshairRecoil();

    // Animate each line moving outward
    this.animateLineMovement(
      this.topLine,
      'top',
      '50%',
      `calc(50% - ${spreadDistance}vh)`
    );
    this.animateLineMovement(
      this.bottomLine,
      'top',
      '50%',
      `calc(50% + ${spreadDistance}vh)`
    );
    this.animateLineMovement(
      this.leftLine,
      'left',
      '50%',
      `calc(50% - ${spreadDistance}vh)`
    );
    this.animateLineMovement(
      this.rightLine,
      'left',
      '50%',
      `calc(50% + ${spreadDistance}vh)`
    );
  }

  /**
   * Animates the crosshair recoil effect when shooting
   * Moves the crosshair up and scales it slightly for visual feedback
   */
  animateCrosshairRecoil() {
    // Store original transform
    const originalTransform = this.crosshair.style.transform;

    // Add recoil movement (move up and slightly back with scale)
    this.crosshair.style.transition = 'transform 80ms ease-out';
    this.crosshair.style.transform = 'translate(-50%, -52%) scale(1.15)';

    // Reset after recoil
    setTimeout(() => {
      this.crosshair.style.transition = 'transform 120ms ease-in';
      this.crosshair.style.transform = originalTransform;
    }, 80);
  }

  /**
   * Animates a crosshair line movement from one position to another
   * @param {HTMLElement} line - The line element to animate
   * @param {string} position - CSS position property to animate ('top', 'left', etc.)
   * @param {string} fromPos - Starting position value
   * @param {string} toPos - Ending position value
   */
  animateLineMovement(line, position, fromPos, toPos) {
    console.log(`Moving line ${position} from ${fromPos} to ${toPos}`);

    // Set initial state
    line.style[position] = fromPos;
    line.style.transition = 'none';

    // Force reflow
    line.offsetHeight;

    // Animate to spread position
    line.style.transition = `${position} ${UI_CONFIG.CROSSHAIR_SPREAD_DURATION}ms ease-out`;
    line.style[position] = toPos;

    // Reset after animation
    setTimeout(() => {
      line.style.transition = `${position} ${UI_CONFIG.CROSSHAIR_SPREAD_DURATION}ms ease-in`;
      line.style[position] = fromPos;
    }, UI_CONFIG.CROSSHAIR_SPREAD_DURATION);
  }

  // ==== Hit Marker ====
  /**
   * Creates the hit marker element with diagonal lines
   * Sets up the hit marker container and its line components
   */
  createHitMarker() {
    /** @type {HTMLElement} Hit marker container element */
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

  /**
   * Creates the hit marker line elements in diagonal directions
   * Creates four diagonal lines forming an X pattern
   */
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

  /**
   * Creates a single hit marker line element
   * @param {Object} config - Line configuration object
   * @param {number} config.rotation - Rotation angle in degrees
   * @param {string} config.x - X position property
   * @param {string} config.y - Y position property
   * @param {string} config.origin - Transform origin
   * @returns {HTMLElement} The hit marker line element
   */
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

  /**
   * Shows the hit marker with fade in/out animation
   * Displays the hit marker briefly when a target is hit
   */
  showHitMarker() {
    this.hitMarker.style.opacity = '1';
    setTimeout(() => {
      this.hitMarker.style.opacity = '0';
    }, UI_CONFIG.HIT_MARKER_DURATION);
  }

  // ==== Kill Counter ====
  /**
   * Creates the kill counter display element
   * Shows current kills vs required kills to win
   */
  createKillCounter() {
    /** @type {HTMLElement} Kill counter display element */
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

  /**
   * Updates the kill counter display with new kill count
   * @param {number} killCount - Current number of kills
   */
  updateKillCounter(killCount) {
    this.currentKillCount = killCount;
    this.updateKillCounterDisplay();

    // Add a brief highlight effect when kill count increases
    this.killCounter.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
    this.killCounter.style.color = '#000';
    setTimeout(() => {
      this.killCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.killCounter.style.color = '#fff';
    }, 200);
  }

  /**
   * Updates the kill counter display text
   * Shows current kills vs effective kill count needed to win
   */
  updateKillCounterDisplay() {
    const currentKillCount = this.currentKillCount || 0;
    const effectiveKillCountToWin = getEffectiveKillCountToWin();
    this.killCounter.textContent = `Kills: ${currentKillCount}/${effectiveKillCountToWin}`;
  }

  // ==== Game Over Overlay ====
  /**
   * Creates the game over overlay element
   * Sets up the main overlay container for game over screen
   */
  createOverlay() {
    /** @type {HTMLElement} Game over overlay container */
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

  /**
   * Creates the button wrapper container for game over overlay
   * @returns {HTMLElement} Button wrapper element containing play again and download buttons
   */
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

  /**
   * Creates a button element with specified label and click handler
   * @param {string} label - Button text label
   * @param {Function} handler - Click event handler function
   * @returns {HTMLElement} The created button element
   */
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

    // Add touch events for mobile support
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default touch behavior
      btn.style.backgroundColor = COLORS.BUTTON_HOVER;
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent default touch behavior
      btn.style.backgroundColor = COLORS.BUTTON_BACKGROUND;
      handler(e);
    });
    btn.addEventListener('touchcancel', () => {
      btn.style.backgroundColor = COLORS.BUTTON_BACKGROUND;
    });

    return btn;
  }

  /**
   * Handles the download button click event
   * Determines platform and opens appropriate app store link
   */
  handleDownload() {
    if (this.downloadHandler) {
      this.downloadHandler();
    } else {
      this.defaultDownloadHandler();
    }
  }

  /**
   * Shows the game over overlay
   * Makes the overlay visible when the game ends
   */
  showGameOverOverlay() {
    this.overlay.style.visibility = 'visible';
  }

  /**
   * Hides the game over overlay
   * Makes the overlay invisible
   */
  hideGameOverOverlay() {
    this.overlay.style.visibility = 'hidden';
  }

  /**
   * Handles window resize events and updates UI elements
   * Adjusts UI element positions and sizes for responsive design
   */
  resize() {
    // Update crosshair position (should stay centered)
    if (this.crosshair) {
      this.crosshair.style.top = '50%';
      this.crosshair.style.left = '50%';
    }

    // Update hit marker position (should stay centered)
    if (this.hitMarker) {
      this.hitMarker.style.top = '50%';
      this.hitMarker.style.left = '50%';
    }

    // Update kill counter position
    if (this.killCounter) {
      this.killCounter.style.top = '2vh';
      this.killCounter.style.left = '2vh';
    }

    // Update overlay size
    if (this.overlay) {
      this.overlay.style.width = '100vw';
      this.overlay.style.height = '100vh';
    }
  }

  /**
   * Sets a custom download handler function
   * @param {Function} fn - Custom download handler function
   */
  setDownloadHandler(fn) {
    this.downloadHandler = fn;
  }

  /**
   * Default download handler that opens app store based on platform
   * Detects mobile platform and opens appropriate app store link
   */
  defaultDownloadHandler() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    if (isAndroid) {
      window.open(this.androidAppLink, '_blank');
    } else if (isIOS) {
      window.open(this.iosAppLink, '_blank');
    } else {
      // Default to Android link for desktop
      window.open(this.androidAppLink, '_blank');
    }
  }

  /**
   * Disposes of the UI overlay and cleans up all elements
   * Removes all DOM elements and event listeners
   */
  dispose() {
    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Remove DOM elements
    if (this.crosshair && this.crosshair.parentNode) {
      this.crosshair.parentNode.removeChild(this.crosshair);
    }
    if (this.hitMarker && this.hitMarker.parentNode) {
      this.hitMarker.parentNode.removeChild(this.hitMarker);
    }
    if (this.killCounter && this.killCounter.parentNode) {
      this.killCounter.parentNode.removeChild(this.killCounter);
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
