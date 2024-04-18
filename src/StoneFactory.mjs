import { Event } from './Event.mjs'
import { Kernel } from './Kernel.mjs'
import { Config } from '@stone-js/config'
import { EventEmitter } from './EventEmitter.mjs'
import { Container } from '@stone-js/service-container'
import { ErrorHandler, RuntimeException, LogicException, isClass, isPlainObject } from '@stone-js/common'

/**
 * Class representing StoneFactory.
 *
 * @version 1.0.0
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class StoneFactory {
  static VERSION = '1.0.0'

  #hooks
  #booted
  #config
  #kernels
  #handler
  #providers
  #container
  #errorHandler
  #eventEmitter
  #registeredProviders
  #hasBeenBootstrapped

  /**
   * Create an instance of StoneFactory.
   *
   * @param {Function|Function.constructor} handler - User-defined application handler.
   * @param {Object}   [options={}] - Application configuration options.
   * @return {StoneFactory} An Application object.
   * @static
   */
  static create (AppModule, configurations = {}) {
    return new this(AppModule, configurations)
  }

  /**
   * Create an application.
   *
   * @param {Function|Function.constructor} handler - User-defined application handler.
   * @param {Object}   [options={}] - Application configuration options.
   */
  constructor (handler, options = {}) {
    this.#hooks = {}
    this.#booted = false
    this.#handler = handler
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()

    this.#registerBaseBindings(options)
  }

  /** @return {string} */
  get version () {
    return StoneFactory.VERSION
  }

  /** @return {Config} */
  get config () {
    return this.#config
  }

  /** @return {Container} */
  get container () {
    return this.#container
  }

  /** @return {EventEmitter} */
  get events () {
    return this.#eventEmitter
  }

  /** @return {EventEmitter} */
  get eventEmitter () {
    return this.#eventEmitter
  }

  /** @return {ErrorHandler} */
  get errorHandler () {
    return this.#errorHandler
  }

  /** @return {boolean} */
  get hasBeenBootstrapped () {
    return this.#hasBeenBootstrapped
  }

  resolveService (Service) {
    return new Service(this.#container)
  }

  registerService (Service, singleton = true, alias = []) {
    this.#container.autoBinding(Service, Service, singleton, alias)
    return this
  }

  registerInstance (key, instance, alias = []) {
    this.#container.instance(key, instance).alias(key, alias)
    return this
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
   * Handle IncomingEvent.
   *
   * @param   {IncomingHttpEvent} event
   * @returns {Object}
   */
  async handle (event) {
    await this._onEventHandled(event)
    await this._sendEventThroughDestination(event)
    return await this._afterRunning(response)
  }

  /**
   * Hook that runs once before everything.
   * Useful to initialize and cache things.
   */
  async onInit () {
    if (Array.isArray(this.#hooks.onInit)) {
      for (const listener of this.#hooks.onInit) {
        await listener(this.#container)
      }
    }

    if (isFunction(this.#handler?.onInit)) {
      await this.#handler.onInit(this.#container)
    }
  }

  /**
   * Hook that runs at each events and just before running the action handler.
   * Useful to bootstrap thing at each event.
   */
  async beforeHandle () {
    if (Array.isArray(this.#hooks.beforeHandle)) {
      for (const listener of this.#hooks.beforeHandle) {
        await listener(this.#container)
      }
    }

    if (isFunction(this.#handler?.beforeHandle)) {
      await this.#handler.beforeHandle(this.#container)
    }
  }

  /**
   * Hook that runs just before of just after returning the response.
   * Useful to make some cleanup.
   */
  async onTerminate () {
    if (Array.isArray(this.#hooks.onTerminate)) {
      for (const listener of this.#hooks.onTerminate) {
        await listener(this.#container)
      }
    }

    if (isFunction(this.#handler?.onTerminate)) {
      await this.#handler.onTerminate(this.#container)
    }

    await this.terminate()
  }

  start () {
    return AppRunner
      .create()
      .setContainer(this.#container)
      .run(this)
  }

  setup () {
    this.emit(Event.SETTING_UP_HOOK, new Event(Event.SETTING_UP_HOOK, this))

    this
      .#makeKernels()
      .#makeProviders()
      .#makeBootstrappers()

    return this.emit(Event.SETUP_HOOK, new Event(Event.SETUP_HOOK, this))
  }

  async register () {
    for (const provider of this.#providers) {
      await this.registerProvider(provider)
    }
  }

  async boot () {
    if (this.#booted) return

    this.#registerEventListeners()

    for (const provider of this.#providers) {
      await this.bootProvider(provider)
    }

    this.#booted = true

    return this
  }

  async start (input = null) {
    this.emit(Event.STARTING_HOOK, new Event(Event.STARTING_HOOK, this, { input }))

    const output = await this.kernel.run(input)

    this.emit(Event.STARTED_HOOK, new Event(Event.STARTED_HOOK, this, { input, output }))

    return output
  }

  stop () {
    return this.terminate()
  }

  async terminate () {
    this.emit(Event.TERMINATING_HOOK, new Event(Event.TERMINATING_HOOK, this))

    if (this.kernel.terminate) {
      await this.kernel.terminate()
    }

    for (const provider of this.#providers) {
      if (provider.terminate) {
        await provider.terminate()
      }
    }

    this.clear()

    return this.emit(Event.TERMINATE_HOOK, new Event(Event.TERMINATE_HOOK, this))
  }

  async bootstrapWith (bootstrappers) {
    this.#hasBeenBootstrapped = true

    for (const bootstrapper of bootstrappers) {
      this.emit(`bootstrapping:${bootstrapper.name}`, this.#container)
      await this.#container.make(bootstrapper).bootstrap(this.#container)
      this.emit(`bootstrapped:${bootstrapper.name}`, this.#container)
    }

    return this
  }

  providerIsRegistered (Provider) {
    return this.#registeredProviders.has(Provider.constructor.name)
  }

  /**
   * Set hooks.
   *
   * @param   {Object} hooks
   * @returns {this}
   */
  setHooks (hooks) {
    this.#hooks = hooks
    return this
  }

  /**
   * Skip all middleware.
   *
   * @param  {boolean} [value=true]
   * @return {this}
   */
  skipMiddleware (value = true) {
    this.#config.set('middleware.skip', value)
    return this
  }

  async registerProvider (provider, force = false) {
    if (!provider.register) {
      throw new LogicException(`This provider ${provider.toString()} must contain a register method`)
    }

    if (this.providerIsRegistered(provider) && !force) {
      return this
    }

    this.emit(Event.PROVIDER_REGISTERING, new Event(Event.PROVIDER_REGISTERING, this, provider))

    await provider.register()

    this.#markAsRegistered(provider)

    if (this.#booted) {
      await this.bootProvider(provider)
    }

    return this.emit(Event.PROVIDER_REGISTERED, new Event(Event.PROVIDER_REGISTERED, this, provider))
  }

  async bootProvider (provider) {
    if (!provider.boot) return this

    this.emit(Event.PROVIDER_BOOTING, new Event(Event.PROVIDER_BOOTING, this, provider))

    await provider.boot()

    return this.emit(Event.PROVIDER_BOOTED, new Event(Event.PROVIDER_BOOTED, this, provider))
  }

  /**
   * Set hanlder.
   *
   * @param  {(Function|Object)} handler
   * @returns {this}
   */
  setHandler (handler) {
    this.#handler = handler
    return this
  }

  getEnvironment () {
    return this.#config.get('app.env', 'production')
  }

  isDebug () {
    return this.#config.get('app.debug', false)
  }

  isEnv (env) {
    return this.getEnvironment() === env
  }

  isProduction () {
    return this.isEnv('production')
  }

  setLocale (locale) {
    this.#config.set('app.locale.default', locale)
    this.emit(Event.LOCALE_UPDATED, new Event(Event.LOCALE_UPDATED, this, locale))
    return this
  }

  getLocale () {
    return this.#config.get('app.locale.default', this.getFallbackLocale())
  }

  isLocale (locale) {
    return this.getLocale() === locale
  }

  setFallbackLocale (locale) {
    this.#config.set('app.locale.fallback', locale)
    return this
  }

  getFallbackLocale () {
    return this.#config.get('app.locale.fallback', 'en')
  }

  abort (code, message, metadata = {}) {
    throw new RuntimeException(message, code, metadata)
  }

  clear () {
    this.#config.clear()
    this.#container.clear()
    this.#eventEmitter.removeAllListeners()

    this.#booted = false
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()
  }

  #markAsRegistered (provider) {
    this.#registeredProviders.add(provider.constructor.name)
    return this
  }

  #registerBaseBindings (options) {
    this.#container = new Container()
    this.#config = new Config(options)
    this.#eventEmitter = new EventEmitter()
    this.#errorHandler = new ErrorHandler()

    this
      .#container
      .instance(Config, this.#config)
      .instance(Container, this.#container)
      .instance(ErrorHandler, this.#errorHandler)
      .instance(EventEmitter, this.#eventEmitter)
      .alias(Config, 'config')
      .alias(Container, 'container')
      .alias(EventEmitter, 'events')
      .alias(ErrorHandler, 'errorHandler')
      .alias(EventEmitter, 'eventEmitter')

    return this
      .#registerHookListeners()
  }

  #registerEventListeners () {
    return this
      .#registerConfigListeners()
      .#registerConfigSubscribers()
      .#registerProvidersListeners()
      .#registerProvidersSubscribers()
  }

  #registerProvidersListeners () {
    for (const provider of this.#providers) {
      if (provider.listeners) {
        this.#registerEventListener(Object.entries(provider.listeners))
      }
    }

    return this
  }

  #registerProvidersSubscribers () {
    for (const provider of this.#providers) {
      if (provider.subscribers) {
        for (const subscriber of provider.subscribers) {
          this.#registerEventSubscriber(subscriber)
        }
      }
    }

    return this
  }

  #registerConfigListeners () {
    return this.#registerEventListener(Object.entries(this.#config.get('app.listeners', {})))
  }

  #registerConfigSubscribers () {
    for (const subscriber of this.#config.get('app.subscribers', [])) {
      this.#registerEventSubscriber(subscriber)
    }

    return this
  }

  #registerHookListeners () {
    return this.#registerEventListener(Object.entries(this.#config.get('app.hookListeners', {})))
  }

  #registerEventSubscriber (eventSubscriber) {
    eventSubscriber.subscribe(this.#container)
    return this
  }

  #registerEventListener (eventListener) {
    for (const [eventName, listeners] of eventListener) {
      for (const listener of listeners) {
        this
          .registerService(listener)
          .on(eventName, e => this.get(listener).handle(e))
      }
    }

    return this
  }

  #registerConfigBindings () {
    for (const binding of this.#config.get('app.bindings', [])) {
      this.#container.autoBinding(binding.name ?? binding.value, binding.value, binding.singleton, binding.alias)
    }

    return this
  }

  #makeBootstrappers () {
    for (const Class of this.kernel.bootstrappers) {
      this.registerService(Class)
    }

    return this
  }

  #makeProviders () {
    for (const Class of this.#config.get('app.providers', [])) {
      this.#providers.add(this.resolveService(Class))
    }

    return this
  }

  #makeKernels () {
    for (const [name, Class] of Object.entries(this.#config.get('app.kernel.kernels', {}))) {
      this.#kernels.set(name, this.resolveService(Class))
    }

    if (!this.#kernels.has('default')) {
      this.#kernels.set('default', this.resolveService(Kernel))
    }

    return this
  }
}
