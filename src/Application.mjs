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
import { Launcher } from './Launcher.mjs'
import { ApplicationException } from './exceptions/ApplicationException.mjs'
import { Container } from '@stone-js/service-container'
import { ExceptionHandler, ExceptionHandler } from './ExceptionHandler.mjs'

/**
 * Class representing an Application.
 *
 * @version 0.0.1
 * @author Mr. Stone <pierre.evens16@gmail.com>
 */
export class Application {
  static VERSION = '0.0.1'

  #booted
  #kernels
  #context
  #providers
  #container
  #eventEmitter
  #userDefinedApp
  #registeredProviders
  #hasBeenBootstrapped

  /**
   * Create an application.
   *
   * @param {Object} context - The application context.
   */
  constructor (context = null) {
    this.#booted = false
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()
    this.#context = context ?? {}

    this.#registerBaseBindings()
  }

  /**
   * Launch the application with a specific launcher.
   *
   * @param  {Object} [context={}] - The application context.
   * @return {any}
   * @static
   */
  static launch (context = {}) {
    const config = typeof context === 'function'
      ? { userDefinedApp: context }
      : (context ?? {})

    config.launcher ??= 'default'
    const LauncherClass = config.launchers?.[config.launcher] ?? config.launchers?.default ?? Launcher
    const launcher = new LauncherClass()

    if (launcher.launch) {
      return launcher.launch(this, config)
    }

    throw new LogicException('Launcher must have a launch method')
  }

  /**
   * Create a default instance of application.
   *
   * @param  {Object} context - The application context.
   * @return {Application} An Application object.
   * @static
   */
  static default (context = {}) {
    return new this(context)
  }

  /**
   * Get application's version.
   * @return {string} The version.
   */
  get version () {
    return Application.VERSION
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

  get userDefinedApp () {
    return this.#userDefinedApp
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

  app (userDefinedApp) {
    return this.setApp(userDefinedApp)
  }

  setApp (userDefinedApp) {
    this.#userDefinedApp = userDefinedApp ?? this.#userDefinedApp
    return this
  }

  addKernel (key, kernel) {
    this.#context.kernels ??= {}
    this.#context.kernels[key] = kernel
    return this
  }

  hasKernel (key) {
    return !!this.getKernel(key)
  }

  getKernel (key) {
    return this.#context.kernels?.[key]
  }

  setKernel (key) {
    if (this.hasKernel(key)) {
      this.#context.kernel = key
      return this
    }

    throw new LogicException(`No kernel registered with this name ${key}`)
  }

  get kernel () {
    const kernel = this.#context.kernel ?? 'default'

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

  run (userDefinedApp = null) {
    return this
      .setApp(userDefinedApp)
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
      .#makeContextItems()

    this.emit(Setup, new Setup(this))
    this.emit(Setup.alias, new Setup(this))

    return this
  }

  async register () {
    for (const provider of this.#providers) {
      await this.registerProvider(provider)
    }
    return this
  }

  async boot () {
    if (this.#booted) return

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

    this.emit(Terminate, new Terminate(this))
    this.emit(Terminate.alias, new Terminate(this))

    this.clear()

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
    if (this.#providers.has(provider) && !force) {
      return this.#providers.get(provider)
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
    return this.get('app.env')
  }

  isDebug () {
    return this.get('app.debug')
  }

  isLocal () {
    return this.get('app.env') === 'local'
  }

  isProduction () {
    return this.get('app.env') === 'production'
  }

  setLocale (locale) {
    this.instance('app.locale', locale)
    this.emit(LocaleUpdated, new LocaleUpdated(locale))
    this.emit(LocaleUpdated.alias, new LocaleUpdated(locale))
    return this
  }

  getLocale () {
    return this.get('app.locale', this.getFallbackLocale())
  }

  isLocale (locale) {
    return this.getLocale() === locale
  }

  setFallbackLocale (locale) {
    this.instance('app.fallbackLocale', locale)
    return this
  }

  getFallbackLocale () {
    return this.get('app.fallbackLocale', 'en')
  }

  abort (code, message, metadata = {}) {
    throw new ApplicationException(message, code, metadata)
  }

  clear () {
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

  #registerBaseBindings () {
    this.#container = new Container()
    this.#eventEmitter = new EventEmitter()

    this
      .#container
      .instance('app', this)
      .instance(Container, this.#container)
      .instance('events', this.#eventEmitter)
      .instance(EventEmitter, this.#eventEmitter)
      .autoBinding(ExceptionHandler)
      .instance('logger', console)

    this.#userDefinedApp = () => {
      return {
        run () {
          console.log('Hello world!')
        }
      }
    }

    return this
  }

  #registerContextBindings () {}

  #makeContextItems () {
    this
      .setApp(this.#context.userDefinedApp)
      .registerInstance('app.debug', this.#context?.debug ?? false)
      .registerInstance('app.locale', this.#context?.locale ?? 'en')
      .registerInstance('app.env', this.#context?.env ?? 'production')
      .registerInstance('app.fallbackLocale', this.#context?.fallbackLocale ?? 'en')

    return this
  }

  #makeBootstrappers () {
    for (const Class of this.kernel.bootstrappers) {
      this.registerService(Class)
    }

    return this
  }

  #makeProviders () {
    for (const Class of this.#context.providers ?? []) {
      this.#providers.add(this.resolveService(Class))
    }

    return this
  }

  #makeKernels () {
    for (const [name, Class] of Object.entries(this.#context.kernels ?? {})) {
      this.#kernels.set(name, this.resolveService(Class))
    }

    if (!this.#kernels.has('default')) {
      this.#kernels.set('default', this.resolveService(Kernel))
    }

    return this
  }
}
