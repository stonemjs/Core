import { get, set } from 'lodash-es'
import { Macroable, isPlainObject } from '@stone-js/common'

/**
 * Class representing an Event.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Event extends Macroable {
  /** @type {string} */
  #type

  /** @type {Object} */
  #source

  /** @type {number} */
  #timeStamp

  /** @type {*} */
  #metadata

  /**
   * Create an Event.
   *
   * @param  {string} type - Event type/name.
   * @param  {Object} source - The event origin or context.
   * @param  {*} [metadata={}] - Event metadata.
   */
  constructor (type, source, metadata = {}) {
    super()
    this.#type = type
    this.#source = source
    this.#metadata = metadata
    this.#timeStamp = Date.now()
  }

  /** @returns {string} */
  get type () {
    return this.#type
  }

  /** @returns {string} */
  get name () {
    return this.#type
  }

  /** @returns {Object} */
  get source () {
    return this.#source
  }

  /** @returns {number} */
  get timeStamp () {
    return this.#timeStamp
  }

  /**
   * Get metadata.
   *
   * @returns {*}
   */
  getMetadata () {
    return this.#metadata
  }

  /**
   * Get data from metadata.
   *
   * @param   {string} key
   * @param   {*} [fallback=null]
   * @returns {*}
   */
  metadata (key, fallback = null) {
    return isPlainObject(this.#metadata) ? get(this.#metadata, key, fallback) : this.#metadata
  }

  /**
   * Get data from metadata.
   *
   * @param   {string} key
   * @param   {*} [fallback=null]
   * @returns {*}
   */
  get (key, fallback = null) {
    return this.metadata(key, fallback)
  }

  /**
   * Add data to metadata.
   *
   * @param   {(string|object)} key
   * @param   {*} [value=null]
   * @returns {this}
   */
  set (key, value = null) {
    if (!isPlainObject(this.#metadata)) {
      this.#metadata = value
    } else {
      Object
        .entries(isPlainObject(key) ? key : { [key]: value })
        .forEach(([name, val]) => set(this.#metadata, name, val))
    }

    return this
  }
}
