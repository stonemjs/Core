import { Booted } from './events/Booted.mjs'
import { EventManager } from './EventManager.mjs'
import { Registered } from './events/Registered.mjs'
import { Registering } from './events/Registering.mjs'
import { Started } from './events/Started.mjs'
import { Starting } from './events/Starting.mjs'
import { Terminate } from './events/Terminate.mjs'
import { Terminating } from './events/Terminating.mjs'
import { Booting } from './events/Booting.mjs'
import { Container } from '@noowow-community/service-container'
import { LogicException } from './exceptions/LogicException.mjs'
import { SettingUp } from './events/SettingUp.mjs'
import { Setup } from './events/Setup.mjs'
import { LocaleUpdated } from './events/LocaleUpdated.mjs'
import { Kernel } from './Kernel.mjs'
import { Launcher } from './Launcher.mjs'
import { ApplicationException } from './exceptions/ApplicationException.mjs'

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
  #container
  #providers
  #launchers
  #eventManager
  #configurations
  #userDefinedApp
  #registeredProviders
  #hasBeenBootstrapped

  /**
   * Create an application.
   * 
   * @param {Object} configurations - The application configurations.
   */
  constructor (configurations = null) {
    this.#booted = false
    this.#kernels = new Map()
    this.#launchers = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()
    this.#configurations = configurations ?? {}

    this.#registerBaseBindings()
  }

  /**
   * Create a default instance of application.
   * 
   * @param  {Object} configurations - The application configurations.
   * @return {Application} An Application object.
   * @static
   */
  static default (configurations) {
    return new this(configurations)
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
    return this.#eventManager
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

  on (eventType, callback) {
    this.#eventManager.subscribe(eventType, callback)
    return this
  }

  notify (eventType, data) {
    this.#eventManager.notify(eventType, data)
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
    this.#configurations.kernels ??= {}
    this.#configurations.kernels[key] = kernel
    return this
  }

  hasKernel (key) {
    return !!this.getKernel(key)
  }

  getKernel (key) {
    return this.#configurations.kernels?.[key]
  }

  setKernel (key) {
    if (this.hasKernel(key)) {
      this.#configurations.kernel = key
      return this
    }

    throw new LogicException(`No kernel registered with this name ${key}`)
  }

  get kernel () {
    const kernel = this.#configurations.kernel ?? 'default'

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

  addLauncher (key, launcher) {
    this.#configurations.launchers ??= {}
    this.#configurations.launchers[key] = launcher
    return this
  }

  hasLauncher (key) {
    return !!this.getLauncher(key)
  }

  getLauncher (key) {
    return this.#configurations.launchers?.[key]
  }

  get launcher () {
    const name = this.#configurations.launcher ?? 'default'
    if (this.hasResolvedLauncher(name)) {
      const launcher = this.getResolvedLauncher(name)
      if (launcher.launch) {
        return launcher
      }
      throw new LogicException('Launcher must have a launch method')
    }
    throw new LogicException(`No launcher exist with this name ${name}`)
  }

  setLauncher (key) {
    if (this.hasLauncher(key)) {
      this.#configurations.launcher = key
      return this
    }

    throw new LogicException(`No launcher registered with this name ${key}`)
  }

  hasResolvedLauncher (key) {
    return this.#launchers.has(key)
  }

  getResolvedLauncher (key) {
    return this.#launchers.get(key)
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
    this.notify(SettingUp, new SettingUp(this))
    this.notify('app.settingUp', new SettingUp(this))

    this
      .#makeKernels()
      .#makeLaunchers()
      .#makeProviders()
      .#makeBootstrappers()
      .#makeConfigurations()

    this.notify(Setup, new Setup(this))
    this.notify('app.setup', new Setup(this))

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
    this.notify(Starting, new Starting(this))
    this.notify('app.starting', new Starting(this))

    const response = await this.launcher.launch()

    this.notify(Started, new Started(this, response))
    this.notify('app.started', new Started(this, response))

    return response
  }

  stop () {
    return this.terminate()
  }

  async terminate () {
    this.notify(Terminating, new Terminating(this))
    this.notify('app.terminating', new Terminating(this))

    if (this.kernel.terminate) {
      await this.kernel.terminate()
    }

    if (this.launcher.terminate) {
      await this.launcher.terminate()
    }

    for (const provider of this.#providers) {
      if (provider.terminate) {
        await provider.terminate()
      }
    }

    this.notify(Terminate, new Terminate(this))
    this.notify('app.terminate', new Terminate(this))

    this.clear()

    return this
  }

  async bootstrapWith (bootstrappers) {
    this.#hasBeenBootstrapped = true

    for (const bootstrapper of bootstrappers) {
      this.notify(`bootstrapping:${bootstrapper.name}`, this.#container)
      await this.#container.make(bootstrapper).bootstrap(this.#container)
      this.notify(`bootstrapped:${bootstrapper.name}`, this.#container)
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

    this.notify(Registering, new Registering(this, provider))
    this.notify('app.registering', new Registering(this, provider))

    if (provider.register) {
      await provider.register()
    } else {
      throw new LogicException(`This provider ${provider.toString()} must contain a register method`)
    }

    this.#markAsRegistered(provider)

    if (this.#booted) {
      this.bootProvider(provider)
    }

    this.notify(Registered, new Registered(this, provider))
    this.notify('app.registered', new Registered(this, provider))

    return this
  }

  async bootProvider (provider) {
    this.notify(Booting, new Booting(this, provider))
    this.notify('app.booting', new Booting(this, provider))

    if (provider.boot) {
      await provider.boot()
    }

    this.notify(Booted, new Booted(this, provider))
    this.notify('app.booted', new Booted(this, provider))

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
    this.events.notify(LocaleUpdated, new LocaleUpdated(locale))
    this.events.notify('locale.updated', new LocaleUpdated(locale))
    return this
  }

  getLocale () {
    return this.get('app.locale', this.getFallbackLocale())
  }

  isLocale (locale) {
    return this.getLocale() === locale
  }

  setFallbackLocale (locale) {
    this.instance('app.fallback_locale', locale)
    return this
  }

  getFallbackLocale () {
    return this.get('app.fallback_locale', 'en')
  }

  abort (code, message, metadata = {}) {
    throw new ApplicationException(message, code, metadata)
  }

  clear () {
    this.#container.clear()
    this.#eventManager.clear()

    this.#booted = false
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#launchers = new Map()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()
  }

  #markAsRegistered (provider) {
    this.#registeredProviders.add(provider.constructor.name)
    return this
  }

  #registerBaseBindings () {
    this.#container = new Container()
    this.#eventManager = new EventManager()

    this
      .#container
      .instance('app', this)
      .instance(Container, this.#container)
      .instance('container', this.#container)
      .instance('events', this.#eventManager)
      .instance(EventManager, this.#eventManager)

    this.#userDefinedApp = () => {
      return {
        run () {
          console.log('Hello world!')
        }
      }
    }

    return this
  }

  #makeConfigurations () {
    this.registerInstance('app.debug', this.#configurations?.debug ?? false)
    this.registerInstance('app.locale', this.#configurations?.locale ?? 'en')
    this.registerInstance('app.env', this.#configurations?.env ?? 'production')
    this.registerInstance('app.fallback_locale', this.#configurations?.fallback_locale ?? 'en')

    return this
  }

  #makeBootstrappers () {
    for (const Class of this.kernel.bootstrappers) {
      this.registerService(Class)
    }

    return this
  }

  #makeProviders () {
    for (const Class of this.#configurations.providers ?? []) {
      this.#providers.add(this.resolveService(Class))
    }

    return this
  }

  #makeKernels () {
    for (const [name, Class] of Object.entries(this.#configurations.kernels ?? {})) {
      this.#kernels.set(name, this.resolveService(Class))
    }

    if (!this.#kernels.has('default')) {
      this.#kernels.set('default', this.resolveService(Kernel))
    }

    return this
  }

  #makeLaunchers () {
    for (const [name, Class] of Object.entries(this.#configurations.launchers ?? {})) {
      this.#launchers.set(name, this.resolveService(Class))
    }

    if (!this.#launchers.has('default')) {
      this.#launchers.set('default', this.resolveService(Launcher))
    }

    return this
  }
}
