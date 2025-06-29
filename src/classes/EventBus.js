/**
 * @fileoverview EventBus class implementing a singleton event system for game-wide communication.
 * Provides event registration, emission, and removal capabilities with priority-based ordering.
 *
 * @author Alper Açık
 * @version 1.0.0
 */

/**
 * EventBus class for managing game events with priority-based ordering
 * Implements singleton pattern to ensure single instance across the application
 */
export class EventBus {
  /**
   * Creates a new EventBus instance or returns existing singleton instance
   * @constructor
   */
  constructor() {
    if (EventBus._instance) {
      return EventBus._instance;
    }

    EventBus._instance = this;
    /** @type {Object.<string, Array>} Event listeners storage: { eventName: [ {cb, order, seq} ] } */
    this._listeners = {};
    /** @type {number} Global incrementing sequence for tie-breaks in priority ordering */
    this._seq = 0;

    return EventBus._instance;
  }

  /**
   * Register a listener for an event with optional priority ordering
   * @param {string} event - Name of the event to listen for
   * @param {Function} cb - Callback function to invoke when event is emitted
   * @param {number} [order=0] - Numeric priority (lower = earlier execution). Default 0.
   */
  on(event, cb, order = 0) {
    if (!this._listeners[event]) this._listeners[event] = [];

    // Push object with priority & registration sequence
    this._listeners[event].push({ cb, order, seq: this._seq++ });

    // Keep the array sorted by (order, seq)
    this._listeners[event].sort((a, b) =>
      a.order === b.order ? a.seq - b.seq : a.order - b.order
    );
  }

  /**
   * Remove a specific listener from an event
   * @param {string} event - Name of the event to remove listener from
   * @param {Function} cb - Callback function to remove
   */
  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((l) => l.cb !== cb);
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} event - Name of the event to emit
   * @param {...*} args - Arguments to pass to the callback functions
   */
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    // Slice → protect against listeners added/removed during emit
    for (const { cb } of this._listeners[event].slice()) cb(...args);
  }
}
