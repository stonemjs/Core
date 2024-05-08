import deepmerge from 'deepmerge'
import { Kernel } from './Kernel.mjs'
import { RuntimeError, isConstructor } from '@stone-js/common'

/**
 * Class representing StoneFactory.
 *
 * @version 1.0.0
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class StoneFactory {
  #hooks
  #options

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
   * @param   {(Function|Object)} options - Application configuration options or user-defined application handler.
   * @returns {StoneFactory} An Application object.
   */
  static create (options) {
    return new this(options)
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
   * @param   {string} [alias=null] - Adapter alias name.
   * @returns {*}
   * @throws  {RuntimeError}
   */
  async run (alias = null) {
    return this.#makeAdapter(alias).hooks(this.#hooks).run()
  }

  /**
   * Make current adapter.
   * Select the current adapter and create an instance.
   *
   * @param   {string} [alias=null] - Adapter alias name.
   * @returns {Adapter}
   * @throws  {RuntimeError}
   */
  #makeAdapter (alias) {
    const aliases = [alias, this.#options.app.adapter.current].filter(v => !!v)
    const current = this.#options.adapters.find((v) => aliases.includes(v.app.adapter.alias) || v.app.adapter.default)
    const Adapter = current?.app.adapter.type
    const handler = this.#options.app.handler

    if (!isConstructor(Adapter)) {
      throw new RuntimeError('No adapters provided.')
    }

    const options = deepmerge(this.#options, current)

    return Adapter.create(() => Kernel.create(handler, options), options.app.adapter)
  }
}
