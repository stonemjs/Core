import { Event } from './Event.mjs'
import { Config } from '@stone-js/config'
import { Pipeline } from '@stone-js/pipeline'
import { EventEmitter } from './EventEmitter.mjs'
import { ErrorHandler } from './ErrorHandler.mjs'
import { Container } from '@stone-js/service-container'
import { NODE_CONSOLE_PLATFORM } from '@stone-js/adapters'
import { IncomingEvent, RuntimeError, isConstructor, isFunction, OutgoingResponse } from '@stone-js/common'

/**
 * Class representing a Kernel.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Kernel {
  #config
  #booted
  #handler
  #commands
  #container
  #providers
  #eventEmitter
  #currentEvent
  #currentResponse
  #registeredProviders

  /**
   * Create a Kernel.
   *
   * @param   {Function} [handler=null] - User-defined application handler.
   * @param   {runnerOptions} [options={}] - AppRunner configuration options.
   * @returns {Kernel}
   */
  static create (handler = null, options = {}) {
    return new this(handler, options)
  }

  /**
   * Create a Kernel.
   *
   * @param {Function} [handler=null] - User-defined application handler.
   * @param {runnerOptions} [options={}] - AppRunner configuration options.
   */
  constructor (handler = null, options = {}) {
    this.#booted = false
    this.#commands = new Set()
    this.#providers = new Set()
    this.#registeredProviders = new Set()

    this
      .#registerBaseBindings(options)
      .#registerErrorHandler()
      .#makeProviders()
      .#registerHandler(handler)
  }

  /** @return {Container} */
  get container () {
    return this.#container
  }

  /** @return {Router} */
  get router () {
    return this.#container.has('router') ? this.#container.router : null
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
   * Hook that runs at each events and before everything.
   * Useful to initialize things at each events.
   */
  async beforeHandle () {
    for (const provider of this.#providers) { await provider.beforeHandle?.() }
    await this.#handler?.beforeHandle?.()
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
   * Hook that runs just before of just after returning the response.
   * Useful to make some cleanup.
   * Invoke kernel, router and current route terminate middlewares.
   */
  async onTerminate () {
    await this.#handler?.onTerminate?.()
    for (const provider of this.#providers) { await provider.onTerminate?.() }
    await Pipeline
      .create(this.#container)
      .send(this.#currentEvent, this.#currentResponse)
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

    this.#registerServices()
    this.#registerAlias()
    this.#registerListeners()
    this.#registerMappers()
    this.#registerSubscribers()
    this.#registerCommands()

    await this.#handler?.register?.()
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
    if (isFunction(this.#handler?.boot)) { await this.#handler.boot() }

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
  async _prepareDestination (event) {
    this.#currentEvent = event
    this.#container.autoBinding(IncomingEvent, this.#currentEvent, true, ['event', 'request'])

    if (this.#isConsoleAndHasCommands()) {
      return this.#dispathToCommands(event)
    }

    if (this.router) {
      return this.router.dispatch(this.#currentEvent)
    }

    if (isFunction(this.#handler)) {
      return this.#handler(this.#currentEvent)
    } else if (isFunction(this.#handler?.handle)) {
      return this.#handler.handle(this.#currentEvent)
    }

    throw new TypeError('No router or correct handler has been provided.')
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

    this.#container.autoBinding(OutgoingResponse, this.#currentResponse, true, ['response'])
    this.#eventEmitter.emit(Event.PREPARING_RESPONSE, new Event(Event.PREPARING_RESPONSE, this, { event, response: this.#currentResponse }))
    this.#currentResponse = await this.#currentResponse.prepare(event, this.#config)
    this.#eventEmitter.emit(Event.RESPONSE_PREPARED, new Event(Event.RESPONSE_PREPARED, this, { event, response: this.#currentResponse }))

    this.#currentResponse = await Pipeline
      .create(this.#container)
      .send(event, this.#currentResponse)
      .through(this.responseMiddleware)
      .then((_, response) => response)

    this.#currentResponse.render && await this.#currentResponse.render(event) // Only for frontend rendering
    this.#eventEmitter.emit(Event.EVENT_HANDLED, this, { event, response: this.#currentResponse })

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

  #makeProviders () {
    this
      .#config
      .get('app.providers', [])
      .forEach((Class) => this.#providers.add(this.#container.resolve(Class, true)))

    return this
  }

  #registerHandler (handler) {
    this.#handler = isConstructor(handler) ? this.#container.resolve(handler, true) : handler

    return this
  }

  #registerErrorHandler () {
    this.#container.autoBinding(ErrorHandler, ErrorHandler, true, 'errorHandler')

    return this
  }

  async #registerProviders () {
    for (const provider of this.#providers) {
      if (!provider.register) {
        throw new RuntimeError(`This provider ${provider.toString()} must contain a register method`)
      }

      if (this.#registeredProviders.has(provider.constructor.name)) {
        continue
      }

      await provider.register()

      this.#registeredProviders.add(provider.constructor.name)

      if (this.#booted) {
        await provider.boot?.()
      }
    }
  }

  #registerServices () {
    this.#container.register(this.#config.get('app.services', []))
    return this
  }

  #registerListeners () {
    Array
      .from(this.#providers.values())
      .reduce(
        (prev, provider) => prev.concat(Object.entries(provider.listeners ?? {})),
        Object.entries(this.#config.get('app.listeners', {}))
      )
      .forEach(([event, listeners = []]) => {
        listeners.forEach((listener) => {
          this.#eventEmitter.on(event, (e) => this.#container.resolve(listener, true).handle(e))
        })
      })

    return this
  }

  #registerSubscribers () {
    Array
      .from(this.#providers.values())
      .reduce(
        (prev, provider) => prev.concat(provider.subscribers ?? []),
        this.#config.get('app.subscribers', [])
      )
      .forEach((subscriber) => this.#container.resolve(subscriber, true).subscribe(this.#eventEmitter))

    return this
  }

  #registerCommands () {
    Array
      .from(this.#providers.values())
      .reduce(
        (prev, provider) => prev.concat(provider.commands ?? []),
        this.#config.get('app.commands', [])
      )
      .forEach((command) => this.#commands.add(this.#container.resolve(command, true)))

    this.#commands.forEach((command) => command.registerCommand?.())

    return this
  }

  #registerAlias () {
    Array
      .from(this.#providers.values())
      .reduce(
        (prev, provider) => prev.concat(Object.entries(provider.aliases ?? {})),
        Object.entries(this.#config.get('app.aliases', {}))
      )
      .forEach(([Class, alias]) => isConstructor(Class) && this.#container.alias(Class, alias))

    return this
  }

  #registerMappers () {
    if (this.#config.get('app.mapper.input.type')) {
      const Mapper = this.#config.get('app.mapper.input.type')
      const resolver = this.#config.get('app.mapper.input.resolver')
      const middleware = this.#config.get('app.mapper.input.middleware', [])

      this.#container.singleton('inputMapper', (container) => Mapper.create(container, middleware, resolver))
    }

    if (this.#config.get('app.mapper.output.type')) {
      const Mapper = this.#config.get('app.mapper.output.type')
      const resolver = this.#config.get('app.mapper.output.resolver')
      const middleware = this.#config.get('app.mapper.output.middleware', [])

      this.#container.singleton('outputMapper', (container) => Mapper.create(container, middleware, resolver))
    }

    return this
  }

  async #bootProviders () {
    for (const provider of this.#providers) {
      await provider.boot?.()
    }
  }

  #isConsoleAndHasCommands () {
    return this.#container.make('platformName') === NODE_CONSOLE_PLATFORM && this.#commands.size > 0
  }

  #dispathToCommands (event) {
    for (const command of this.#commands) {
      if (command.match(event)) { return command.handle(event) }
    }
    this.#container.builder.showHelp()
  }
}
