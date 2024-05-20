import { isFunction } from '@stone-js/common'

/**
 * Class representing an Adapter.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Adapter {
  #hooks
  #options
  #handlerFactory

  /**
   * Create an Apapter.
   *
   * @param   {Function} handlerFactory - Factory to create a new instance of handler.
   * @param   {Object} [options={}] - Adpater configuration options.
   * @returns {Adapter}
   */
  static create (handlerFactory, options = {}) {
    return new this(handlerFactory, options)
  }

  /**
   * Create an Apapter and run it.
   *
   * @param   {Function} handlerFactory - Factory to create a new instance of handler.
   * @param   {Object} [options={}] - Adpater configuration options.
   * @returns {*}
   */
  static createAndRun (handlerFactory, options = {}) {
    return this.create(handlerFactory, options).run()
  }

  /**
   * Create an Apapter.
   *
   * @param {Function} handlerFactory - Factory to create a new instance of handler.
   * @param {Object} [options={}] - Adpater configuration options.
   */
  constructor (handlerFactory, options = {}) {
    this.#hooks = {}
    this.#options = options
    this.#handlerFactory = handlerFactory
  }

  /**
   * Adapter's options.
   *
   * @protected
   * @returns {Object}
   */
  get _options () {
    return this.#options
  }

  /**
   * Handler factory to create a new handler.
   *
   * @protected
   * @returns {Function}
   */
  get _handlerFactory () {
    return this.#handlerFactory
  }

  /**
   * Lifecycle hooks listener.
   *
   * @callback hookListener
   * @param {Container} container - Service container.
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
   * Set hooks.
   *
   * @param   {Object} hooks
   * @returns {this}
   */
  hooks (hooks) {
    this.#hooks = hooks
    return this
  }

  /**
   * Run handler.
   *
   * @returns {*}
   */
  async run () {
    await this._onInit()
    const handler = this.#handlerFactory()
    await this._beforeHandle(handler)
    return await this._onMessageReceived(handler, {})
  }

  /**
   * Incomming message listener.
   *
   * @param   {(Function|Object)} handler - Action handler to be ran.
   * @param   {Object} input - Platform-specific input.
   * @returns {*} - Platform-specific output.
   */
  async _onMessageReceived (handler, input) {
    const container = handler.container

    try {
      const event = await this._getInputMapper(container)?.map(input) ?? input

      const result = isFunction(handler?.handle)
        ? await handler.handle(event)
        : await handler(event)

      const output = await this._getOutputMapper(container)?.map({ ...input, event, result })

      return await output?.send?.()
    } catch (error) {
      return this._handleError(container, error, input)
    } finally {
      await this._onTerminate(handler, input)
    }
  }

  /**
   * Hook that runs once before everything.
   *
   * @throws {TypeError}
   */
  async _onInit () {
    if (!isFunction(this.#handlerFactory)) {
      throw new TypeError('The `handlerFactory` must be a function.')
    }

    if (Array.isArray(this.#hooks.onInit)) {
      for (const listener of this.#hooks.onInit) {
        await listener()
      }
    }
  }

  /**
   * Hook that runs at each events and just before running the action handler.
   *
   * @param {(Function|Object)} handler - Action handler to be ran.
   */
  async _beforeHandle (handler) {
    if (Array.isArray(this.#hooks.beforeHandle)) {
      for (const listener of this.#hooks.beforeHandle) {
        await listener()
      }
    }

    if (isFunction(handler.beforeHandle)) {
      await handler.beforeHandle()
    }
  }

  /**
   * Hook that runs after running the action handler.
   *
   * @param {(Function|Object)} handler - Action handler to be ran.
   * @param {Object} input - Platform-specific input.
   */
  async _onTerminate (handler, _input) {
    if (Array.isArray(this.#hooks.onTerminate)) {
      for (const listener of this.#hooks.onTerminate) {
        await listener()
      }
    }

    if (isFunction(handler.onTerminate)) {
      await handler.onTerminate()
    }
  }

  /**
   * Handle error.
   *
   * @param   {Container} container - Service container.
   * @param   {Error} error
   * @param   {Object} message - Incomming Platform-specific message.
   * @returns {Object} - Platform-specific output.
   */
  _handleError (container, error, message) {
    this._getLogger(container).error(error, message)
  }

  /**
   * Get Config.
   *
   * @param   {Container} container - Service container.
   * @returns {*}
   */
  _getConfig (container) {
    return container?.has('config') ? container.make('config') : null
  }

  /**
   * Get Error Handler.
   *
   * @param   {Container} container - Service container.
   * @returns {ErrorHandler}
   */
  _getErrorHandler (container) {
    return container?.has('errorHandler') ? container.make('errorHandler') : null
  }

  /**
   * Get Logger.
   *
   * @param   {Container} [container=null] - Service container.
   * @returns {*}
   */
  _getLogger (container = null) {
    return container?.has('logger')
      ? container.make('logger')
      : (this.#options.logger ?? console)
  }

  /**
   * Get Input mapper.
   *
   * @param   {Container} container - Service container.
   * @returns {Mapper}
   */
  _getInputMapper (container) {
    return container?.has('inputMapper')
      ? container.make('inputMapper')
      : (this.#options.inputMapper ?? null)
  }

  /**
   * Get Output mapper.
   *
   * @param   {Container} container - Service container.
   * @returns {Mapper}
   */
  _getOutputMapper (container) {
    return container?.has('outputMapper')
      ? container.make('outputMapper')
      : (this.#options.outputMapper ?? null)
  }

  /**
   * Set platform.
   *
   * @param   {Container} container - Service container.
   * @param   {string} platform - Platform name.
   * @returns {this}
   */
  _setPlatform (container, platform) {
    container?.instance('platformName', platform)
    return this
  }
}
