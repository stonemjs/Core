import deepmerge from 'deepmerge'
import { Kernel } from './Kernel.mjs'
import { isClass } from '@stone-js/common'

/**
 * Class representing StoneFactory.
 *
 * @version 1.0.0
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class StoneFactory {
  static VERSION = '1.0.0'

  #hooks
  #options
  #handler

  /**
   * Create a Stone.js application.
   *
   * @param   {Function} [handler=null] - User-defined application handler.
   * @param   {Object} [options={}] - Application configuration options.
   * @returns {StoneFactory} An Application object.
   */
  static create (handler = null, options = {}) {
    return new this(handler, options)
  }

  /**
   * Create a Stone.js application and run it.
   *
   * @param   {Function} [handler=null] - User-defined application handler.
   * @param   {runnerOptions} [options={}] - AppRunner configuration options.
   * @returns {*}
   */
  static createAndRun (handler = null, options = {}) {
    return this.create(handler, options).run()
  }

  /**
   * Create a Stone.js application.
   *
   * @param {Function} [handler=null] - User-defined application handler.
   * @param {Object} [options={}] - Application configuration options.
   */
  constructor (handler = null, options = {}) {
    this.#handler = handler
    this.#options = options
  }

  /** @returns {string} */
  get version () {
    return StoneFactory.VERSION
  }

  /**
   * Lifecycle hooks listener.
   *
   * @callback hookListener
   */

  /**
   * Register event listener for lifecycle hooks.
   *
   * @param   {('onInit'|'beforeHandle'|'onTerminate')} event
   * @param   {hookListener} listener
   * @returns {this}
   */
  hook (event, listener) {
    this.#hooks[event] ??= []
    this.#hooks[event].push(listener)
    return this
  }

  /**
   * Run handler.
   *
   * @returns {*}
   * @throws  {RuntimeError}
   */
  async run () {
    return this.#makeAdapter().hooks(this.#hooks).run()
  }

  #makeAdapter () {
    let options = Object.values(this.#options).reduce((prev, option) => deepmerge(prev, option), {})

    const current = options.app.adapters.find((v) => v.app.adapter.default)
    const Adapter = current?.app.adapter.type
    
    if (!isClass(Adapter)) {
      throw new RuntimeError('No adapters provided.')
    }

    options = deepmerge(options, current)

    return Adapter.create(() => Kernel.create(this.#handler, options), options.app.adapter)
  }
}
