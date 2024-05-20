import { Config } from '@stone-js/config'
import { Pipeline } from '@stone-js/pipeline'
import { isFunction } from '@stone-js/common'
import { KernelEvent } from './KernelEvent.mjs'
import { EventEmitter } from './EventEmitter.mjs'
import { ErrorHandler } from './ErrorHandler.mjs'
import { Container } from '@stone-js/service-container'
import { IncomingEvent, OutgoingResponse } from '@stone-js/event-foundation'

/**
 * Class representing a Kernel.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Kernel {
  #config
  #booted
  #container
  #providers
  #eventEmitter
  #currentEvent
  #currentResponse
  #registeredProviders

  /**
   * Create a Kernel.
   *
   * @param   {Object} [options={}] - App Global configuration options.
   * @returns {Kernel}
   */
  static create (options = {}) {
    return new this(options)
  }

  /**
   * Create a Kernel.
   *
   * @param {Object} [options={}] - App Global configuration options.
   */
  constructor (options = {}) {
    this.#booted = false
    this.#providers = new Set()
    this.#registeredProviders = new Set()

    this
      .#registerBaseBindings(options)
      .#registerErrorHandler()
  }

  /** @return {Container} */
  get container () {
    return this.#container
  }

  /** @returns {boolean} */
  get skipMiddleware () {
    return this.#config.get('app.kernel.middleware.skip', false)
  }

  /** @return {Function[]} */
  get middleware () {
    return this.skipMiddleware ? {} : this.#config.get('app.kernel.middleware', {})
  }

  /** @return {Function[]} */
  get eventMiddleware () {
    return this.middleware.event ?? []
  }

  /** @return {Function[]} */
  get responseMiddleware () {
    return this.middleware.response ?? []
  }

  /** @return {Function[]} */
  get terminateMiddleware () {
    return this.middleware.terminate ?? []
  }

  /**
   * Make and return the App handler.
   * App handler is used to handle event when no router is provided.
   * App handler must be manually registered as provider in explicit configuration context.
   * But it is automatically registered as provider in implicit configuration context.
   *
   * @return {Function}
   */
  get #handler () {
    return this.#config.has('app.handler')
      ? this.#container.resolve(this.#config.get('app.handler'), true)
      : null
  }

  /**
   * Hook that runs at each events and before everything.
   * Useful to initialize things at each events.
   */
  async beforeHandle () {
    // Resolve providers
    this.#resolveProviders()

    // Call beforeHandle on providers
    for (const provider of this.#providers) { await provider.beforeHandle?.() }

    // Register services in providers
    await this._onRegister()
  }

  /**
   * Handle IncomingEvent.
   *
   * @param   {(IncomingEvent|IncomingHttpEvent)} event
   * @returns {(OutgoingResponse|OutgoingHttpResponse)}
   */
  async handle (event) {
    await this._onBootstrap(event)
    await this._sendEventThroughDestination(event)
    return this._prepareResponse(event)
  }

  /**
   * Hook that runs just before or just after returning the response.
   * Useful to make some cleanup.
   * Invoke kernel and providers terminate middlewares.
   */
  async onTerminate () {
    for (const provider of this.#providers) { await provider.onTerminate?.() }
    await Pipeline
      .create(this.#container)
      .send({ event: this.#currentEvent, response: this.#currentResponse })
      .through(this.terminateMiddleware)
      .thenReturn()
  }

  /**
   * Register services to container.
   *
   * @protected
   */
  async _onRegister () {
    await this.#registerProviders()
  }

  /**
   * Hook that runs at each events and just before running the action handler.
   * Useful to bootstrap thing at each event.
   *
   * @protected
   * @param  {IncomingEvent} event
   * @throws {TypeError}
   */
  async _onBootstrap (event) {
    if (!event) { throw new TypeError('No IncomingEvent provided.') }
    if (event.clone) { this.#container.autoBinding('originalEvent', event.clone()) }
    if (this.#booted) { return }

    await this.#bootProviders()

    this.#booted = true
  }

  /**
   * Send Event to destination.
   *
   * @protected
   * @param {IncomingEvent} event
   */
  async _sendEventThroughDestination (event) {
    this.#currentResponse = await Pipeline
      .create(this.#container)
      .send({ event })
      .through(this.eventMiddleware)
      .then((v) => this._prepareDestination(v.event))
  }

  /**
   * Prepare Event destination.
   *
   * @protected
   * @param   {IncomingEvent} event
   * @returns {*}
   * @throws  {TypeError}
   */
  async _prepareDestination (event) {
    this.#currentEvent = event
    this.#container.autoBinding(IncomingEvent, this.#currentEvent, true, ['event', 'request'])

    // If App router is bound dispatch event to routes.
    if (this.#container.has('router')) {
      return this.#container.router.dispatch(this.#currentEvent)
    }

    // If no routers are bound dispatch event to app handler.
    if (isFunction(this.#handler?.handle)) {
      return this.#handler.handle(this.#currentEvent)
    }

    throw new TypeError('No router nor handler has been provided.')
  }

  /**
   * Prepare response before sending
   *
   * @protected
   * @param   {IncomingEvent} event
   * @returns {(OutgoingResponse|OutgoingHttpResponse)}
   */
  async _prepareResponse (event) {
    if (!this.#currentResponse) return

    if (!(this.#currentResponse instanceof OutgoingResponse)) {
      throw new TypeError('Return response must be an instance of `OutgoingResponse` or a subclass of it.')
    }

    this.#container.autoBinding(OutgoingResponse, this.#currentResponse, true, ['response'])
    this.#eventEmitter.emit(KernelEvent.PREPARING_RESPONSE, new KernelEvent(KernelEvent.PREPARING_RESPONSE, this, { event, response: this.#currentResponse }))
    this.#currentResponse = await this.#currentResponse.prepare(event, this.#config)
    this.#eventEmitter.emit(KernelEvent.RESPONSE_PREPARED, new KernelEvent(KernelEvent.RESPONSE_PREPARED, this, { event, response: this.#currentResponse }))

    this.#currentResponse = await Pipeline
      .create(this.#container)
      .send({ event, response: this.#currentResponse })
      .through(this.responseMiddleware)
      .then(({ response }) => response)

    this.#eventEmitter.emit(KernelEvent.EVENT_HANDLED, this, { event, response: this.#currentResponse })

    return this.#currentResponse
  }

  #registerBaseBindings (options) {
    this.#container = new Container()
    this.#config = new Config(options)
    this.#eventEmitter = new EventEmitter()

    this
      .#container
      .instance(Config, this.#config)
      .instance(Container, this.#container)
      .instance(EventEmitter, this.#eventEmitter)
      .alias(Config, 'config')
      .alias(Container, 'container')
      .alias(EventEmitter, 'events')
      .alias(EventEmitter, 'eventEmitter')

    return this
  }

  #resolveProviders () {
    this
      .#config
      .get('app.providers', [])
      .map((provider) => this.#container.resolve(provider, true))
      .filter((provider) => !provider.mustSkip?.())
      .forEach((provider) => this.#providers.add(provider))

    return this
  }

  #registerErrorHandler () {
    this.#container.autoBinding(ErrorHandler, ErrorHandler, true, 'errorHandler')
    return this
  }

  async #registerProviders () {
    for (const provider of this.#providers) {
      if (!provider.register || this.#registeredProviders.has(provider.constructor.name)) {
        continue
      }

      await provider.register()

      this.#registeredProviders.add(provider.constructor.name)

      if (this.#booted) {
        await provider.boot?.()
      }
    }
  }

  async #bootProviders () {
    for (const provider of this.#providers) {
      await provider.boot?.()
    }
  }
}
