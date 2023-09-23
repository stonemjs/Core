import { Booted } from './events/Booted.mjs'
import { EventManager } from './EventManager.mjs'
import { Registered } from './events/Registered.mjs'
import { Registering } from './events/Registering.mjs'
import { Started } from './events/Started.mjs'
import { Starting } from './events/Starting.mjs'
import { Terminate } from './events/Terminate.mjs'
import { Terminating } from './events/Terminating.mjs'
import { Booting } from './events/booting.mjs'
import { Container } from '@noowow-community/service-container'
import { LogicException } from './exceptions/LogicException.mjs'
import { SettingUp } from './events/SettingUp.mjs'
import { Setup } from './events/Setup.mjs'
import { LocaleUpdated } from './events/LocaleUpdated.mjs'
import { DefaultKernel } from './kernel/DefaultKernel.mjs'
import { DefaultLauncher } from './launchers/DefaultLauncher.mjs'

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

  constructor ({ configurations = {} }) {
    this.#booted = false
    this.#kernels = new Map()
    this.#launchers = new Map()
    this.#providers = new Set()
    this.#hasBeenBootstrapped = false
    this.#registeredProviders = new Set()
    this.#configurations = configurations ?? {}

    this.#registerBaseBindings()
  }

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
    return this.#eventManager.subscribe(eventType, callback)
  }

  notify (eventType, data) {
    this.#eventManager.notify(eventType, data)
  }

  app (userDefinedApp) {
    return this.setApp(userDefinedApp)
  }

  setApp (userDefinedApp) {
    this.#userDefinedApp = userDefinedApp ?? this.#userDefinedApp
    return this
  }

  get kernel () {
    const kernel = this.configurations.kernel ?? 'default'

    if (this.hasKernel(kernel)) {
      return this.getResolvedKernel(kernel)
    }

    throw new LogicException(`No kernel registered for this name ${kernel}`)
  }

  addKernel (key, kernel) {
    this.configurations.kernels ??= {}
    this.configurations.kernels[key] = kernel
    return this
  }

  hasKernel (key) {
    return !!this.getKernel(key)
  }

  getKernel (key) {
    return this.configurations.kernels?.[key]
  }

  getResolvedKernel (key) {
    return this.#kernels.get(key)
  }

  get launcher () {
    const name = this.configurations.launcher ?? 'default'
    if (this.hasLauncher(name)) {
      const launcher = this.getResolvedLauncher(name)
      if (launcher.launch) {
        return launcher
      }
      throw new LogicException('Launcher must have a launch method')
    }
    throw new LogicException(`No launcher exist with this name ${name}`)
  }

  addLauncher (key, launcher) {
    this.configurations.launchers ??= {}
    this.configurations.launchers[key] = launcher
    return this
  }

  hasLauncher (key) {
    return !!this.getLauncher(key)
  }

  getLauncher (key) {
    return this.configurations.launchers?.[key]
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
    this.#eventManager.notify(SettingUp, new SettingUp(this))
    this.#eventManager.notify('app.settingUp', new SettingUp(this))

    this
      .#makeKernels()
      .#makeLaunchers()
      .#makeProviders()
      .#makeBootstrappers()

    this.#eventManager.notify(Setup, new Setup(this))
    this.#eventManager.notify('app.setup', new Setup(this))

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
    this.#eventManager.notify(Starting, new Starting(this))
    this.#eventManager.notify('app.starting', new Starting(this))

    const response = await this.launcher.launch()

    this.#eventManager.notify(Started, new Started(this))
    this.#eventManager.notify('app.started', new Started(this))

    return response
  }

  stop () {
    return this.terminate()
  }

  async terminate () {
    this.#eventManager.notify(Terminating, new Terminating(this))
    this.#eventManager.notify('app.terminating', new Terminating(this))

    for (const provider of this.#providers) {
      if (provider.terminate) {
        await provider.terminate()
      }
    }

    if (this.launcher.stop) {
      await this.launcher.stop()
    }

    this.#eventManager.notify(Terminate, new Terminate(this))
    this.#eventManager.notify('app.terminate', new Terminate(this))

    this.clear()

    return this
  }

  async bootstrapWith (bootstrappers) {
    this.#hasBeenBootstrapped = true

    for (const bootstrapper of bootstrappers) {
      this.notify(`bootstrapping:${bootstrapper.name}`, this.#container)
      await this.make(bootstrapper).bootstrap(this.#container)
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

    this.#eventManager.notify(Registering, new Registering({ app: this, provider }))
    this.#eventManager.notify('app.registering', new Registering({ app: this, provider }))

    if (provider.register) {
      await provider.register()
    } else {
      throw new LogicException(`This provider ${provider.toString()} must contain a register method`)
    }

    this.#markAsRegistered(provider)

    if (this.#booted) {
      this.bootProvider(provider)
    }

    this.#eventManager.notify(Registered, new Registered({ app: this, provider }))
    this.#eventManager.notify('app.registered', new Registered({ app: this, provider }))

    return this
  }

  async bootProvider (provider) {
    this.#eventManager.notify(Booting, new Booting({ app: this, provider }))
    this.#eventManager.notify('app.booting', new Booting({ app: this, provider }))

    if (provider.boot) {
      await provider.boot()
    }

    this.#eventManager.notify(Booted, new Booted({ app: this, provider }))
    this.#eventManager.notify('app.booted', new Booted({ app: this, provider }))

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
    this.kernel.abort(code, message, metadata)
  }

  shouldSkipMiddleware () {
    return this.get('app.middleware.disable') === true
  }

  clear () {
    super.clear()

    this.#booted = false
    this.#kernels = new Map()
    this.#providers = new Set()
    this.#launchers = new Map()
    this.#hasBeenBootstrapped = false
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

    this.#userDefinedApp = () => console.log('Hello world!')

    return this
  }

  #makeBootstrappers () {
    const bootstrappers = []
      .concat(this.#configurations.bootstrappers ?? [], this.kernel.bootstrappers)
      .reduce((prev, curr) => prev.concat(prev.includes(curr) ? [] : [curr]), [])

    for (const Class of bootstrappers) {
      this.registerService(Class)
    }

    return this
  }

  #makeProviders () {
    for (const Class of this.#configurations.providers) {
      this.#providers.add(this.resolveService(Class))
    }

    return this
  }

  #makeKernels () {
    for (const kernel of this.#configurations.kernels) {
      const [name, Class] = Object.entries(kernel)
      this.#kernels.set(name, this.resolveService(Class))
    }

    if (!this.#kernels.has('default')) {
      this.#kernels.set('default', this.resolveService(DefaultKernel))
    }

    return this
  }

  #makeLaunchers () {
    for (const launcher of this.#configurations.launchers) {
      const [name, Class] = Object.entries(launcher)
      this.#launchers.set(name, this.resolveService(Class))
    }

    if (!this.#launchers.has('default')) {
      this.#launchers.set('default', this.resolveService(DefaultLauncher))
    }

    return this
  }
}
