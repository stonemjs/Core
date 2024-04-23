import { Event } from './Event.mjs'
import { Kernel } from './Kernel.mjs'
import { Config } from '@stone-js/config'
import { EventEmitter } from './EventEmitter.mjs'
import { Container } from '@stone-js/service-container'
import { RuntimeException, LogicException, isClass, isPlainObject } from '@stone-js/common'

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
   * @param   {(Function|Function.constructor)} [handler=null] - User-defined application handler.
   * @param   {Object} [options={}] - Application configuration options.
   * @returns {StoneFactory} An Application object.
   */
  static create (handler = null, options = {}) {
    return new this(handler, options)
  }

  /**
   * Create a Stone.js application and run it.
   *
   * @param   {(Function|Function.constructor)} [handler=null] - User-defined application handler.
   * @param   {runnerOptions} [options={}] - AppRunner configuration options.
   * @returns {*}
   */
  static createAndRun (handler = null, options = {}) {
    return this.create(handler, options).run()
  }

  /**
   * Create a Stone.js application.
   *
   * @param {(Function|Function.constructor)} [handler=null] - User-defined application handler.
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
   */
  async run () {
    return this
      .#getRunner()
      .hooks(this.#hooks)
      .run()
  }

  #getRunner () {
    return this
      .#options
      .runner
      .create({ adapters: this.#getAdapters(), current: this.#options.adapter.current })
  }

  #getKernelResolver () {
    return () => Kernel.create(this.#handler, this.#options)
  }

  #getAdapters () {
    return this
      .#options
      .adapters.map(v => ({
        alias: v.alias,
        resolver: () => v.adapter.create(this.#getKernelResolver(), this.#options)
      }))
  }
}
