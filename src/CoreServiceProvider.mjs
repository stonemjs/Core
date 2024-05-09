import { isConstructor } from '@stone-js/common'

/**
 * Class representing a CoreServiceProvider.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class CoreServiceProvider {
  #config
  #container
  #eventEmitter

  /**
   * Create a new instance of Provider.
   *
   * @param {Container} container
   */
  constructor (container) {
    this.#container = container
    this.#config = container.config
    this.#eventEmitter = container.eventEmitter
  }

  /** @returns {Function[]} */
  get #services () {
    return this.#config.get('app.services', [])
  }

  /** @returns {Function[]} */
  get #listeners () {
    return this.#config.get('app.listeners', {})
  }

  /** @returns {Function[]} */
  get #subscribers () {
    return this.#config.get('app.subscribers', [])
  }

  /** @returns {Function[]} */
  get #aliases () {
    return this.#config.get('app.aliases', {})
  }

  /**
   * Register core components in service container.
   *
   * @returns
   */
  register () {
    this
      .#registerServices()
      .#registerMappers()
      .#registerListeners()
      .#registerAlias()
  }

  /**
   * Boot core components.
   *
   * @returns
   */
  boot () {
    this.#bootSubscribers()
  }

  #registerServices () {
    this.#container.register(this.#services.filter(v => !!v.$$metadata$$?.service))
    this.#services.filter(v => !v.$$metadata$$?.service).forEach(service => this.#container.autoBinding(service, service, true))
    return this
  }

  #registerAlias () {
    Object
      .entries(this.#aliases)
      .forEach(([alias, Class]) => isConstructor(Class) && this.#container.alias(Class, alias))

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

  #registerListeners () {
    this.#listeners
      .forEach((listener) => {
        if (listener.$$metadata$$?.listener.event) {
          this.#eventEmitter.on(listener.$$metadata$$.listener.event, (e) => this.#container.resolve(listener, true).handle(e))
        }
      })

    return this
  }

  #bootSubscribers () {
    this.#subscribers.forEach((subscriber) => this.#container.resolve(subscriber, true).subscribe(this.#eventEmitter))
    return this
  }
}
