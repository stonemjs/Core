import { isFunction } from './utils.mjs'
import { StoneFactory } from './StoneFactory.mjs'
import { LogicException } from './exceptions/LogicException.mjs'

export class Adapter {
  #context
  #appModule
  #configurations

  constructor (app, configurations = {}) {
    if (app instanceof StoneFactory) {
      this.#context = app
    } else if (isFunction(app)) {
      this.#appModule = app
      this.#configurations = configurations
    } else {
      throw new LogicException('The first argument must be an instance of StoneFactory or your AppModule(function or class).')
    }
  }

  static create (app, configurations = {}) {
    return new this(app, configurations)
  }

  getContext () {
    return this.#context ?? StoneFactory.create(this.#appModule, this.#configurations)
  }

  run () {
    return this.getContext().run()
  }
}
