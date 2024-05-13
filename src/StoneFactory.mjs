import deepmerge from 'deepmerge'
import { Kernel } from './Kernel.mjs'
import { isConstructor } from '@stone-js/common'

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
   * @returns {*}
   * @throws  {RuntimeError}
   */
  async run () {
    return this.#makeAdapter()?.hooks(this.#hooks).run()
  }

  /**
   * Make current adapter.
   * Select the current adapter and create an instance.
   *
   * @returns {Adapter}
   * @throws  {RuntimeError}
   */
  #makeAdapter () {
    // Get current adapter options
    // or the default one if there is no current.
    const current = this.#findCurrentAdapter()

    // Get the Adapter class.
    const Adapter = current?.app?.adapter?.type

    if (isConstructor(Adapter)) {
      // Call onInit once for all providers.
      this.#onInit()

      // Merge current adapter options with global
      // so adapter options can override globals.
      const options = deepmerge(this.#options, current)

      // Create the adapter with a kernel factory
      // So adapter can create a new kernel instance a each request
      return Adapter.create(() => Kernel.create(options), options.app.adapter)
    }

    console.error('No adapters provided. Stone.js needs at least one adapter to run.')
  }

  /**
   * Find current adapter.
   *
   * @returns {Adapter}
   */
  #findCurrentAdapter () {
    return this
      .#options
      .adapters
      ?.find((v) => this.#options.app.adapter.current === v.app.adapter.alias) ??
      this
        .#options
        .adapters
        ?.find((v) => v.app.adapter.default)
  }

  /**
   * Call onInit hook on all service providers.
   * OnInit is called once and just after the application runs.
   * Usefull to setup once.
   *
   * @returns
   */
  #onInit () {
    this
      .#options
      .app
      ?.providers
      ?.filter(provider => provider.onInit)
      .forEach(provider => this.hook('onInit', () => provider.onInit()))
  }
}
