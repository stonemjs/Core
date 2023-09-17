export class EventManager {
  #listeners = new Map()

  subscribe (eventType, callback) {
    this.#listeners.set(eventType, this.#addCallback(eventType, callback))
    return this
  }

  unsubscribe (eventType, callback) {
    this.#getCallbacksByEventType(eventType).delete(callback)
    return this
  }

  notify (eventType, data) {
    this.#getCallbacksByEventType(eventType).forEach(callback => callback(data))
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
