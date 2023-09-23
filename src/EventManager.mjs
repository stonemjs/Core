/**
 * Class representing an Application.
 */
export class EventManager {
  #listeners = new Map()

  /**
   * Subscribe to events.
   * @param {string|string[]} events - The event names or the event class.
   * @param {Function} callback - The callback to execute when event fire.
   * @return {this} An EventManager object.
   */
  subscribe (events, callback) {
    events = Array.isArray(events) ? events : [events]
    for (const eventType of events) {
      this.#listeners.set(eventType, this.#addCallback(eventType, callback))
    }
    return this
  }

  /**
   * Check if subscriber exists for the given event.
   * @param {string} eventType - The event name.
   * @return {boolean} A boolean.
   */
  hasSubscriber (eventType) {
    return this.#listeners.has(eventType)
  }

  /**
   * Fire event to related subscribers.
   * @param {string} eventType - The event name.
   * @param {object} data - The event payload.
   * @return {this} An EventManager object.
   */
  notify (eventType, data) {
    this.#getCallbacksByEventType(eventType).forEach(callback => callback(data))
    return this
  }

  /**
   * Unsubscribe to event.
   * @param {string} eventType - The event name.
   * @param {Function} callback - The callback to execute when event fire.
   * @return {this} An EventManager object.
   */
  unsubscribe (eventType, callback) {
    this.#getCallbacksByEventType(eventType).delete(callback)
    return this
  }

  /**
   * Clear events.
   * @return {this} An EventManager object.
   */
  clear () {
    this.#listeners.clear()
    return this
  }

  #addCallback (eventType, callback) {
    const callbacks = this.#getCallbacksByEventType(eventType)
    !callbacks.has(callback) && callbacks.add(callback)
    return callbacks
  }

  #getCallbacksByEventType (eventType) {
    return this.#listeners.get(eventType) ?? new Set()
  }
}
