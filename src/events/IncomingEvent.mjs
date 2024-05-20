import { Event } from './Event.mjs'

/**
 * IncomingEventOptions.
 *
 * @typedef  {Object} IncomingEventOptions
 * @property {Object} [source=null] - Event source.
 * @property {Object} [metadata={}] - Event data.
 * @property {string} [locale='en'] - Event locale.
 * @property {string} [defaultLocale='en'] - Event default locale.
 */

/**
 * Class representing an IncomingEvent.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @extends Event
 */
export class IncomingEvent extends Event {
  /**
   * INCOMING_EVENT Event name, fires on platform message.
   *
   * @type {Symbol}
   * @event IncomingEvent#INCOMING_EVENT
   */
  static INCOMING_EVENT = Symbol('stonejs@incoming_event')

  /** @type {string} */
  #locale

  /** @type {string} */
  #defaultLocale

  /**
   * Create an IncomingEvent.
   *
   * @param   {IncomingEventOptions} options
   * @returns {IncomingEvent}
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create an IncomingEvent.
   *
   * @param {IncomingEventOptions} options
   */
  constructor ({
    type = IncomingEvent.INCOMING_EVENT,
    source = null,
    metadata = {},
    locale = 'en',
    defaultLocale = 'en'
  }) {
    super(type, source, metadata)
    this.#locale = locale
    this.#defaultLocale = defaultLocale
  }

  /** @returns {string} */
  get locale () {
    return this.#locale
  }

  /** @returns {string} */
  get defaultLocale () {
    return this.#defaultLocale
  }

  /**
   * Set locale.
   *
   * @param   {string} locale
   * @returns {this}
   */
  setLocale (locale) {
    this.#locale = locale
    return this
  }

  /**
   * Set default locale.
   *
   * @param   {string} locale
   * @returns {this}
   */
  setDefaultLocale (locale) {
    this.#defaultLocale = locale
    return this
  }

  /**
   * Return a cloned instance.
   *
   * @returns {IncomingEvent}
   */
  clone () {
    return new IncomingEvent({
      type: this.type,
      source: this.source,
      locale: this.#locale,
      metadata: this.getMetadata(),
      defaultLocale: this.#defaultLocale
    })
  }
}
