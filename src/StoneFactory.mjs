import { Event } from './Event.mjs'
import { Kernel } from './Kernel.mjs'
import { Adapter } from './Adapter.mjs'
import { Macroable } from '@stone-js/macroable'
import { EventEmitter } from './EventEmitter.mjs'
import { Container } from '@stone-js/service-container'
import { ExceptionHandler } from './ExceptionHandler.mjs'
import { LogicException } from './exceptions/LogicException.mjs'
import { RuntimeException } from './exceptions/RuntimeException.mjs'
import { ConfigurationManager } from '@stone-js/configuration-manager'

/**
 * Class representing StoneFactory.
 *
 * @version 1.0.0
 * @author Mr. Stone <pierre.evens16@gmail.com>
 */
export class StoneFactory extends Macroable {
  static VERSION = '1.0.0'

  #booted
  #config
  #kernels
  #appModule
  #providers
  #container
  #eventEmitter
  #registeredProviders
  #hasBeenBootstrapped

  /**
   * Create an application.
   *
   * @param {Function|Function.constructor} AppModule           - The application module.
   * @param {Object|ConfigurationManager}   [configurations={}] - The application configurations.
   */
  constructor (AppModule, configurations = {}) {
    super()

    this.#booted = false
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()

    this.#registerBaseBindings(AppModule, configurations)
  }

  /**
   * Create an instance of StoneFactory.
   *
   * @param  {Function|Function.constructor} AppModule      - The application module.
   * @param  {Object|ConfigurationManager}   configurations - The application configurations.
   * @return {StoneFactory} An Application object.
   * @static
   */
  static create (AppModule, configurations = {}) {
    return new this(AppModule, configurations)
  }

  /**
   * Create and run application with a specific adapter.
   *
   * @param  {Function|Function.constructor} AppModule - The application module.
   * @param  {Object} [options={}] - The application configurations.
   * @return {any}
   * @static
   */
  static createAndRun (AppModule, options = {}) {
    const config = new ConfigurationManager(options ?? {})
    const adapterName = config.get('app.adapter', 'default')
    const CurrentAdapter = config.get(`app.adapters.${adapterName}`, Adapter)

    if (CurrentAdapter.prototype.run) {
      return CurrentAdapter.create(AppModule, config).run()
    }

    throw new LogicException('Adapter must have a run method')
  }

  /**
   * Get application's version.
   * @return {string} The version.
   */
  get version () {
    return StoneFactory.VERSION
  }

  get config () {
    return this.#config
  }

  get container () {
    return this.#container
  }

  get events () {
    return this.#eventEmitter
  }

  get hasBeenBootstrapped () {
    return this.#hasBeenBootstrapped
  }

  get kernel () {
    const kernel = this.#config.get('app.kernel', 'default')

    if (this.hasResolvedKernel(kernel)) {
      return this.getResolvedKernel(kernel)
    }

    throw new RuntimeException(`No kernel resolved with this name ${kernel}`)
  }

  get appModule () {
    return this.#appModule
  }

  get logger () {
    const logger = this.#config.get('app.logger', 'default')
    return this.#config.get(`app.loggers.${logger}`, console)
  }

  get (key, fallback = null) {
    return this.#container.bound(key)
      ? this.#container.make(key)
      : this.#config.get(key, fallback)
  }

  has (key) {
    return this.#container.bound(key) || this.#config.has(key)
  }

  on (eventName, listener) {
    this.#eventEmitter.on(eventName, listener)
    return this
  }

  emit (eventName, ...data) {
    this.#eventEmitter.emit(eventName, ...data)
    return this
  }

  removeListener (eventName, listener) {
    this.#eventEmitter.removeListener(eventName, listener)
    return this
  }

  app (AppModule) {
    return this.setAppModule(AppModule)
  }

  setAppModule (AppModule) {
    this.#appModule = AppModule ?? this.#appModule
    return this
  }

  addKernel (key, kernel) {
    this.#config.set(`app.kernels.${key}`, kernel)
    return this
  }

  hasKernel (key) {
    return this.#config.has(`app.kernels.${key}`)
  }

  getKernel (key) {
    return this.#config.get(`app.kernels.${key}`)
  }

  setKernel (key) {
    if (this.hasKernel(key)) {
      this.#config.set('app.kernel', key)
      return this
    }

    throw new LogicException(`No kernel registered with this name ${key}`)
  }

  hasResolvedKernel (key) {
    return this.#kernels.has(key)
  }

  getResolvedKernel (key) {
    return this.#kernels.get(key)
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

  run (AppModule = null) {
    return this
      .setAppModule(AppModule)
      .setup()
      .start()
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

    return this.#registerConfigBindings()
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

  async start () {
    this.emit(Event.STARTING_HOOK, new Event(Event.STARTING_HOOK, this))

    const output = await this.kernel.run()

    this.emit(Event.STARTED_HOOK, new Event(Event.STARTED_HOOK, this, output))

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
    this.#config.set('app.locale.code', locale)
    this.emit(Event.LOCALE_UPDATED, new Event(Event.LOCALE_UPDATED, this, locale))
    return this
  }

  getLocale () {
    return this.#config.get('app.locale.code', this.getFallbackLocale())
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

  #registerBaseBindings (AppModule, configurations) {
    this.#container = new Container()
    this.#eventEmitter = new EventEmitter()
    this.#config = configurations instanceof ConfigurationManager ? configurations : new ConfigurationManager(configurations)

    this
      .#container
      .instance(StoneFactory, this)
      .instance(Container, this.#container)
      .instance(EventEmitter, this.#eventEmitter)
      .instance(ConfigurationManager, this.#config)
      .autoBinding(ExceptionHandler, this.#config.get('exceptionHandler', ExceptionHandler))
      .alias(StoneFactory, 'ctx')
      .alias(Container, 'container')
      .alias(EventEmitter, 'events')
      .alias(StoneFactory, 'context')
      .alias(EventEmitter, 'eventEmitter')
      .alias(ConfigurationManager, 'config')
      .alias(ExceptionHandler, 'exceptionHandler')
      .alias(ConfigurationManager, 'configurationManager')

    return this
      .setAppModule(AppModule)
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
    for (const [name, Class] of Object.entries(this.#config.get('app.kernels', {}))) {
      this.#kernels.set(name, this.resolveService(Class))
    }

    if (!this.#kernels.has('default')) {
      this.#kernels.set('default', this.resolveService(Kernel))
    }

    return this
  }
}
