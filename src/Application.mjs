import { Booted } from "./events/Booted.mjs"
import { EventManager } from "./EventManager.mjs"
import { Registered } from "./events/Registered.mjs"
import { Registering } from "./events/Registering.mjs"
import { Started } from "./events/Started.mjs"
import { Starting } from "./events/Starting.mjs"
import { Terminate } from "./events/Terminate.mjs"
import { Terminating } from "./events/Terminating.mjs"
import { Booting } from "./events/booting.mjs"
import { Container } from "@noowow-community/service-container"
import { LogicException } from "./exceptions/LogicException.mjs"
import { SettingUp } from "./events/SettingUp.mjs"
import { Setup } from "./events/Setup.mjs"

export class Application {
  #env
  #kernels
  #container
  #providers
  #launchers
  #eventManager
  #providerInstances
  #currentLauncherName

  constructor ({ providers }) {
    this.#env = new Map()
    this.#kernels = new Map()
    this.#launchers = new Map()
    this.#providers = providers ?? []
    this.#container = new Container()
    this.#providerInstances = new Set()
    this.#currentLauncherName = 'default'
    this.#eventManager = new EventManager()
  }

  get container () {
    return this.#container
  }

  get events () {
    return this.#eventManager
  }

  get (key) {
    return this.#container.make(key)
  }
 
  on (eventType, callback) {
    return this.#eventManager.subscribe(eventType, callback)
  }

  addKernel (key, kernel) {
    this.#kernels.set(key, kernel)
    return this
  }

  hasKernel (key) {
    return this.#kernels.has(key)
  }

  getKernel (key) {
    return this.#kernels.get(key)
  }

  addLauncher (key, launcher) {
    this.#launchers.set(key, launcher)
    return this
  }

  hasLauncher (key) {
    return this.#launchers.has(key)
  }

  getLauncher (key, launcher) {
    return this.#launchers.get(key, launcher)
  }

  getCurrentLauncher () {
    if (this.hasLauncher(this.#currentLauncherName)) {
      const launcher = this.getLauncher(this.#currentLauncherName)
      if (launcher.launch) {
        return launcher
      }
      throw new LogicException(`Launcher must have a launch method`)
    }
    throw new LogicException(`No launcher exist with this name ${this.#currentLauncherName}`)
  }

  async run () {
    this.#setup()
    await this.#register()
    await this.#boot()
    await this.#start()
  }

  async stop () {
    await this.#terminate()
  }

  #makeProvider (ProviderClass) {
    this.#providerInstances.add(new ProviderClass({ app: this, container: this.#container, events: this.#eventManager }))
  }

  #makeProviders () {
    for (const ProviderClass of this.#providers) {
      this.#makeProvider(ProviderClass)
    }
  }
  
  #setup () {
    this.#eventManager.notify(SettingUp, new SettingUp(this))
    this.#eventManager.notify('app.settingUp', new SettingUp(this))
    
    this.#makeProviders()
    
    this.#eventManager.notify(Setup, new Setup(this))
    this.#eventManager.notify('app.setup', new Setup(this))

    return this
  }
  
  async #register () {
    this.#eventManager.notify(Registering, new Registering(this))
    this.#eventManager.notify('app.registering', new Registering(this))

    for (const provider of this.#providerInstances) {
      if (provider.register) {
        await provider.register()
      } else {
        throw new LogicException(`This provider ${provider.toString()} must container a register method`)
      }
    }
    
    this.#eventManager.notify(Registered, new Registered(this))
    this.#eventManager.notify('app.registered', new Registered(this))

    return this
  }
  
  async #boot () {
    this.#eventManager.notify(Booting, new Booting(this))
    this.#eventManager.notify('app.booting', new Booting(this))

    for (const provider of this.#providerInstances) {
      if (provider.boot) {
        await provider.boot()
      }
    }
    
    this.#eventManager.notify(Booted, new Booted(this))
    this.#eventManager.notify('app.booted', new Booted(this))

    return this
  }
  
  async #start () {
    this.#eventManager.notify(Starting, new Starting(this))
    this.#eventManager.notify('app.starting', new Starting(this))

    await this.getCurrentLauncher().launch()

    this.#eventManager.notify(Started, new Started(this))
    this.#eventManager.notify('app.started', new Started(this))
    return this
  }
  
  async #terminate () {
    this.#eventManager.notify(Terminating, new Terminating(this))
    this.#eventManager.notify('app.terminating', new Terminating(this))

    for (const provider of this.#providerInstances) {
      if (provider.terminate) {
        await provider.terminate()
      }
    }
    
    this.#providerInstances.clear()

    this.#eventManager.notify(Terminate, new Terminate(this))
    this.#eventManager.notify('app.terminate', new Terminate(this))

    return this
  }
}

export const proxy = new Proxy()