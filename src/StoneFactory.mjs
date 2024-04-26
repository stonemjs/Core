import deepmerge from 'deepmerge'
import { Kernel } from './Kernel.mjs'
import { RuntimeError, isClass } from '@stone-js/common'

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

  /**
   * Create a Stone.js application.
   *
   * @param   {(Function|Object)} options - Application configuration options or user-defined application handler.
   * @returns {StoneFactory} An Application object.
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create a Stone.js application and run it.
   *
   * @param   {(Function|Object)} options - Application configuration options or user-defined application handler.
   * @returns {*}
   */
  static createAndRun (options) {
    return this.create(options).run()
  }

  /**
   * Create a Stone.js application.
   *
   * @param {(Function|Object)} options - Application configuration options or user-defined application handler.
   */
  constructor (options) {
    this.#hooks = {}
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
    const current = this.#options.adapters.find((v) => v.app.adapter.default)
    const Adapter = current?.app.adapter.type
    const handler = this.#options.app.handler

    if (!isClass(Adapter)) {
      throw new RuntimeError('No adapters provided.')
    }

    const options = deepmerge(this.#options, current)

    return Adapter.create(() => Kernel.create(handler, options), options.app.adapter)
  }
}
