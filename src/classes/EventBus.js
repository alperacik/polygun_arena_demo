export class EventBus {
  constructor() {
    if (EventBus._instance) {
      return EventBus._instance;
    }

    EventBus._instance = this;
    this._listeners = {}; // { eventName: [ {cb, order, seq} ] }
    this._seq = 0; // global incrementing sequence for tie-breaks

    return EventBus._instance;
  }

  /**
   * Register a listener.
   * @param {string}  event   Name of the event
   * @param {Function} cb     Callback to invoke
   * @param {number}  order   Numeric priority (lower = earlier). Default 0.
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
   * Remove a listener.
   */
  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((l) => l.cb !== cb);
  }

  /**
   * Emit an event.
   */
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    // Slice → protect against listeners added/removed during emit
    for (const { cb } of this._listeners[event].slice()) cb(...args);
  }
}
