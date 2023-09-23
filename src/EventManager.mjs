export class EventManager {
  #listeners = new Map()

  subscribe (events, callback) {
    events = Array.isArray(events) ? events : [events]
    for (const eventType of events) {
      this.#listeners.set(eventType, this.#addCallback(eventType, callback))
    }
    return this
  }

  hasSubscriber (eventType) {
    return this.#listeners.has(eventType)
  }

  notify (eventType, data) {
    this.#getCallbacksByEventType(eventType).forEach(callback => callback(data))
    return this
  }

  unsubscribe (eventType, callback) {
    this.#getCallbacksByEventType(eventType).delete(callback)
    return this
  }

  clear () {
    this.#listeners = new Map()
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
