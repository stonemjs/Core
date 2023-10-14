import { Booted } from './events/Booted.mjs'
import { EventEmitter } from './EventEmitter.mjs'
import { Registered } from './events/Registered.mjs'
import { Registering } from './events/Registering.mjs'
import { Started } from './events/Started.mjs'
import { Starting } from './events/Starting.mjs'
import { Terminate } from './events/Terminate.mjs'
import { Terminating } from './events/Terminating.mjs'
import { Booting } from './events/Booting.mjs'
import { LogicException } from './exceptions/LogicException.mjs'
import { SettingUp } from './events/SettingUp.mjs'
import { Setup } from './events/Setup.mjs'
import { LocaleUpdated } from './events/LocaleUpdated.mjs'
import { Kernel } from './Kernel.mjs'
import { Adapter } from './Adapter.mjs'
import { ApplicationException } from './exceptions/ApplicationException.mjs'
import { Container } from '@stone-js/service-container'
import { ExceptionHandler } from './ExceptionHandler.mjs'
import { Macroable } from '@stone-js/macroable'
import { ConfigurationManager } from '@stone-js/configuration-manager'

/**
 * Class representing an Application.
 *
 * @version 1.0.0
 * @author Mr. Stone <pierre.evens16@gmail.com>
 */
export class Application extends Macroable {
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
   * @param {Object} [configurations={}] - The application configurations.
   */
  constructor (configurations = {}) {
    super()

    this.#booted = false
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()

    this.#registerBaseBindings(configurations)
  }

  /**
   * Launch the application with a specific adapter.
   *
   * @param  {Object} [configurations={}] - The application configurations.
   * @return {any}
   * @static
   */
  static launch (configurations = {}) {
    configurations = typeof configurations === 'function'
      ? { app: { appModule: configurations } }
      : (configurations ?? {})

    configurations.adapter ??= 'default'
    const CurrentAdapter = configurations.adapters?.[configurations.adapter] ?? configurations.adapters?.default ?? Adapter
    const adapter = new CurrentAdapter()

    if (adapter.run) {
      return adapter.run(this, configurations)
    }

    throw new LogicException('Adapter must have a run method')
  }

  /**
   * Create a default instance of application.
   *
   * @param  {Object} configurations - The application configurations.
   * @return {Application} An Application object.
   * @static
   */
  static default (configurations = {}) {
    return new this(configurations)
  }

  /**
   * Get application's version.
   * @return {string} The version.
   */
  get version () {
    return Application.VERSION
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

  get appModule () {
    return this.#appModule
  }

  get logger () {
    return this.#config.get(`app.loggers.${this.#config.get('app.logger', 'default')}`, console)
  }

  get (key, fallback = null) {
    return this.#container.bound(key) ? this.#container.make(key) : fallback
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

  app (appModule) {
    return this.setAppModule(appModule)
  }

  setAppModule (appModule) {
    this.#appModule = appModule ?? this.#appModule
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

  get kernel () {
    const kernel = this.#config.get('app.kernel', 'default')

    if (this.hasResolvedKernel(kernel)) {
      return this.getResolvedKernel(kernel)
    }

    throw new LogicException(`No kernel resolved with this name ${kernel}`)
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

  run (appModule = null) {
    return this
      .setAppModule(appModule)
      .setup()
      .start()
  }

  setup () {
    this.emit(SettingUp, new SettingUp(this))
    this.emit(SettingUp.alias, new SettingUp(this))

    this
      .#makeKernels()
      .#makeProviders()
      .#makeBootstrappers()

    this.emit(Setup, new Setup(this))
    this.emit(Setup.alias, new Setup(this))

    return this
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
    this.emit(Starting, new Starting(this))
    this.emit(Starting.alias, new Starting(this))

    const output = await this.kernel.run()

    this.emit(Started, new Started(this, output))
    this.emit(Started.alias, new Started(this, output))

    return output
  }

  stop () {
    return this.terminate()
  }

  async terminate () {
    this.emit(Terminating, new Terminating(this))
    this.emit(Terminating.alias, new Terminating(this))

    if (this.kernel.terminate) {
      await this.kernel.terminate()
    }

    for (const provider of this.#providers) {
      if (provider.terminate) {
        await provider.terminate()
      }
    }

    this.clear()

    this.emit(Terminate, new Terminate(this))
    this.emit(Terminate.alias, new Terminate(this))

    return this
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
    if (this.providerIsRegistered(provider) && !force) {
      return this
    }

    this.emit(Registering, new Registering(this, provider))
    this.emit(Registering.alias, new Registering(this, provider))

    if (provider.register) {
      await provider.register()
    } else {
      throw new LogicException(`This provider ${provider.toString()} must contain a register method`)
    }

    this.#markAsRegistered(provider)

    if (this.#booted) {
      await this.bootProvider(provider)
    }

    this.emit(Registered, new Registered(this, provider))
    this.emit(Registered.alias, new Registered(this, provider))

    return this
  }

  async bootProvider (provider) {
    if (!provider.boot) return this

    this.emit(Booting, new Booting(this, provider))
    this.emit(Booting.alias, new Booting(this, provider))

    await provider.boot()

    this.emit(Booted, new Booted(this, provider))
    this.emit(Booted.alias, new Booted(this, provider))

    return this
  }

  getEnvironment () {
    return this.#config.get('app.env', 'production')
  }

  isDebug () {
    return this.#config.get('app.debug', false)
  }

  isLocal () {
    return this.getEnvironment() === 'local'
  }

  isProduction () {
    return this.getEnvironment() === 'production'
  }

  setLocale (locale) {
    this.#config.set('app.locale', locale)
    this.emit(LocaleUpdated, new LocaleUpdated(locale))
    this.emit(LocaleUpdated.alias, new LocaleUpdated(locale))
    return this
  }

  getLocale () {
    return this.#config.get('app.locale', this.getFallbackLocale())
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
    throw new ApplicationException(message, code, metadata)
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

  #registerBaseBindings (configurations) {
    this.#container = new Container()
    this.#eventEmitter = new EventEmitter()
    this.#config = new ConfigurationManager(configurations)

    this
      .#container
      .instance(Application, this)
      .instance(Container, this.#container)
      .instance(EventEmitter, this.#eventEmitter)
      .instance(ConfigurationManager, this.#config)
      .autoBinding(ExceptionHandler, this.#config.get('exceptionHandler', ExceptionHandler))
      .alias(Application, 'app')
      .alias(Application, 'ctx')
      .alias(Container, 'container')
      .alias(Application, 'context')
      .alias(EventEmitter, 'events')
      .alias(Application, 'application')
      .alias(EventEmitter, 'eventEmitter')
      .alias(ConfigurationManager, 'config')
      .alias(ExceptionHandler, 'exceptionHandler')
      .alias(ConfigurationManager, 'configurationManager')

    return this
      .#registerHookListeners()
      .setAppModule(this.#config.get('app.appModule', this.#defaultAppModule))
  }

  #defaultAppModule () {
    return () => {
      return {
        run () {
          console.log('Hello world!')
        }
      }
    }
  }

  #registerEventListeners () {
    return this
      .#registerConfigListeners()
      .#registerProvidersListeners()
      .#registerConfigSubscribers()
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
        this.registerService(listener)
        this.on(eventName, e => this.get(listener).handle(e))
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
