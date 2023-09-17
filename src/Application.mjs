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

export class Application {
  #providers
  #container
  #eventManager
  #providerInstances

  constructor ({ providers }) {
    this.#container = new Container()
    this.#providers = providers ?? []
    this.#providerInstances = new Set()
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

  async run () {
    await this.#init()
    await this.#setup()
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

  async #init () {
    this.#makeProviders()
    for (const provider of this.#providerInstances) {
      if (provider.init) {
        await provider.init()
      }
    }
    return this
  }
  
  async #setup () {
    for (const provider of this.#providerInstances) {
      if (provider.setup) {
        await provider.setup()
      }
    }
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
  
  #start () {
    this.#eventManager.notify(Starting, new Starting(this))
    this.#eventManager.notify('app.starting', new Starting(this))

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