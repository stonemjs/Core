import { Event } from './Event.mjs'
import { Pipeline } from '@stone-js/pipeline'
import { IncomingEvent, isClass, isFunction } from '@stone-js/common'

/**
 * Class representing a Kernel.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Kernel {
  static name = 'Kernel'

  #hooks
  #config
  #handler
  #container
  #eventEmitter
  #currentEvent
  #currentResponse

  /**
   * Create a Kernel.
   *
   * @param   {Container} container - Service container.
   * @param   {(Function|Object)} [handler=null] - App handler.
   * @returns {Kernel}
   */
  static create (container, handler = null) {
    return new this(container, handler)
  }

  /**
   * Create a Kernel.
   *
   * @param {Container} container - Service container.
   * @param {(Function|Object)} [handler=null] - App handler.
   */
  constructor (container, handler = null) {
    this.#hooks = {}
    this.#handler = handler
    this.#container = container
    this.#config = container.config
    this.#eventEmitter = container.eventEmitter
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

  /**
   * Lifecycle hooks listener.
   *
   * @callback hookListener
   */

  /**
   * Register event listener for lifecycle hooks.
   *
   * @param   {('onBootstrap')} event
   * @param   {hookListener} listener
   * @returns {this}
   */
  hook (event, listener) {
    this.#hooks[event] ??= []
    this.#hooks[event].push(listener)
    return this
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
   * Invoke kernel, router and current route terminate middlewares.
   */
  terminate () {
    return Pipeline
      .create(this.container)
      .send(this.#currentEvent, this.#currentResponse)
      .through(this.terminateMiddleware)
      .via('terminate')
      .thenReturn()
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

    if (Array.isArray(this.#hooks.onBootstrap)) {
      for (const listener of this.#hooks.onBootstrap) {
        await listener(this.#container)
      }
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
}
