import { Event } from './Event.mjs'
import { Pipeline } from '@stone-js/pipeline'
import { IncomingEvent, isClass, isFunction } from '@stone-js/common'

/**
 * Class representing a Kernel.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Kernel {
  #config
  #logger
  #booted
  #handler
  #endedAt
  #startedAt
  #container
  #providers
  #eventEmitter
  #currentEvent
  #errorHandler
  #currentResponse
  #hasBeenBootstrapped
  #registeredProviders

  /**
   * Create a Kernel.
   *
   * @param   {(Function|Function.constructor)} [handler=null] - User-defined application handler.
   * @param   {runnerOptions} [options={}] - AppRunner configuration options.
   * @returns {Kernel}
   */
  static create (handler = null, options = {}) {
    return new this(container, handler)
  }

  /**
   * Create a Kernel.
   *
   * @param {(Function|Function.constructor)} [handler=null] - User-defined application handler.
   * @param {runnerOptions} [options={}] - AppRunner configuration options.
   */
  constructor (handler = null, options = {}) {
    this.#booted = false
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()
    
    this.#registerBaseBindings(handler, options)
  }

  /** @return {Container} */
  get container () {
    return this.#container
  }

  /** @return {Config} */
  get config () {
    return this.#config
  }

  /** @return {EventEmitter} */
  get eventEmitter () {
    return this.#eventEmitter
  }

  /** @returns {ErrorHandler} */
  get errorHandler () {
    return this.#errorHandler
  }

  /** @return {Router} */
  get router () {
    return this.#container.has('router') ? this.#container.router : null
  }

  /** @returns {IncomingEvent} */
  get currentEvent () {
    return this.#currentEvent
  }

  /** @returns {Object} */
  get currentResponse () {
    return this.#currentResponse
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
  get routeMiddleware () {
    const route = this.#currentEvent.route()
    return route ? this.router?.gatherRouteMiddleware(route) : []
  }

  /** @return {Function[]} */
  get terminateMiddleware () {
    return this
      .routeMiddleware
      .filter(v => isClass(v) && !!v.prototype.terminate)
      .concat(this.middleware.terminate ?? [])
  }

  /** @returns {number} */
  get executionDuration () {
    return this.#endedAt - this.#startedAt
  }

  /**
   * Handle IncomingEvent.
   *
   * @param   {IncomingEvent} event
   * @returns {(OutgoingResponse|OutgoingHttpResponse)}
   */
  async handle (event) {
    await this._onBootstrap(event)
    await this._sendEventThroughDestination(event)
    return this._prepareResponse(event)
  }

  /**
   * Hook that runs at each events and before everything.
   * Useful to initialize things at each events.
   */
  async beforeHandle () {
    if (isFunction(this.#handler?.beforeHandle)) {
      await this.#handler.beforeHandle()
    }

    await this._onRegister()
  }

  /**
   * Hook that runs just before of just after returning the response.
   * Useful to make some cleanup.
   * Invoke kernel, router and current route terminate middlewares.
   */
  async onTerminate () {
    if (isFunction(this.#handler?.onTerminate)) {
      await this.#handler.onTerminate()
    }

    await Pipeline
      .create(this.container)
      .send(this.#currentEvent, this.#currentResponse)
      .through(this.terminateMiddleware)
      .via('terminate')
      .thenReturn()
  }

  /**
   * Register services to container.
   *
   * @protected
   */
  async _onRegister () {
    if (isFunction(this.#handler?.register)) {
      await this.#handler.register()
    }
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
    if (!event) {
      throw new TypeError('No IncomingEvent provided.')
    }

    this.#currentEvent = event
    this.#container.registerInstance('originalEvent', event.clone())
    this.#container.registerInstance(IncomingEvent, event, ['event'])

    if (isFunction(this.#handler?.boot)) {
      await this.#handler.boot()
    }
  }

  /**
   * Send Event to destination.
   *
   * @protected
   * @param {IncomingEvent} event
   */
  async _sendEventThroughDestination (event) {
    this.#currentResponse = await Pipeline
      .create(this.container)
      .send(event)
      .through(this.eventMiddleware)
      .then(v => this._prepareDestination(v))
  }

  /**
   * Prepare Event destination.
   *
   * @protected
   * @param   {IncomingEvent} event
   * @returns {*}
   * @throws  {TypeError}
   */
  _prepareDestination (event) {
    if (this.router) {
      return this.router.dispatch(event)
    }

    if (isFunction(this.#handler)) {
      return this.#handler(this.#currentEvent)
    } else if (isFunction(this.#handler?.[this._getHandlerMethod()])) {
      return this.#handler[this._getHandlerMethod()](this.#currentEvent)
    }

    throw new TypeError('No router or correct handler has been provided.')
  }

  /**
   * Handler method name.
   *
   * @returns {string}
   */
  _getHandlerMethod () {
    return this.#config.get('app.handler', 'handle')
  }

  /**
   * Prepare response before sending
   *
   * @protected
   * @param   {IncomingEvent} event
   * @returns {(OutgoingResponse|OutgoingHttpResponse)}
   */
  async _prepareResponse (event) {
    this.#eventEmitter.emit(Event.PREPARING_RESPONSE, new Event(Event.PREPARING_RESPONSE, this, { event, response: this.#currentResponse }))
    this.#currentResponse = await this.#currentResponse.prepare(event)
    this.#eventEmitter.emit(Event.RESPONSE_PREPARED, new Event(Event.RESPONSE_PREPARED, this, { event, response: this.#currentResponse }))

    this.#currentResponse = await Pipeline
      .create(this.container)
      .send(event, this.#currentResponse)
      .through(this.responseMiddleware)
      .then((_, response) => response)

    this.#currentResponse.render && await this.#currentResponse.render(event) // Only for frontend rendering
    this.#eventEmitter.emit(Event.EVENT_HANDLED, this, { event, response: this.#currentResponse })

    return this.#currentResponse
  }

  #registerBaseBindings (handler, options) {
    this.#container = new Container()
    this.#config = new Config(options)
    this.#eventEmitter = new EventEmitter()
    this.#logger = options.logger ?? console
    this.#errorHandler = new ErrorHandler(this.#logger, options.errorHandler ?? {})
    this.#handler = isClass(handler) ? new handler(this.#container) : handler

    this
      .#container
      .instance(Config, this.#config)
      .instance('logger', this.#logger)
      .instance(Container, this.#container)
      .instance(ErrorHandler, this.#errorHandler)
      .instance(EventEmitter, this.#eventEmitter)
      .alias(Config, 'config')
      .alias(Container, 'container')
      .alias(EventEmitter, 'events')
      .alias(ErrorHandler, 'errorHandler')
      .alias(EventEmitter, 'eventEmitter')
  }

  #makeProviders () {
    for (const Class of this.#config.get('app.providers', [])) {
      this.#providers.add(new Class(this.#container))
    }
  }

  #makeMiddleware () {
    for (const Class of this.#config.get('app.middleware', [])) {
      isClass(Class) && this.#container.autoBinding(Class)
    }
  }

  #makeMappers () {
    for (const Class of this.#config.get('app.mappers', [])) {
      isClass(Class) && this.#container.autoBinding(Class)
    }
  }
}
