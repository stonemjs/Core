import { BootProviders } from "../bootstrap/BootProviders.mjs"
import { LoadEnvironmentVariables } from "../bootstrap/LoadEnvironmentVariables.mjs"
import { RegisterProviders } from "../bootstrap/RegisterProviders.mjs"
import { LogicException } from "../exceptions/LogicException.mjs"

export class DefaultKernel {
  static NAME = 'default'
  
  #app
  #endedAt
  #startedAt
  #bootstrappers
  
  constructor ({ app }) {
    this.#app = app

    this.#bootstrappers = [
      LoadEnvironmentVariables,
      RegisterProviders,
      BootProviders,
    ]
  }

  get executionDuration () {
    return this.#endedAt - this.#startedAt
  }

  get bootstrappers () {
    return this.#bootstrappers
  }

  async run () {
    const App = this.#app.userDefinedApp
    if (this.#isFunction(App)) {
      this.#startedAt = Date.now()
      const app = this.#isArrowFunction(App) ? App(this.#app.container) : new App(this.#app.container)

      if (!app.run) {
        throw new LogicException('The app must have a run method')
      }

      try {
        await this.bootstrap()
        const response = await app.run()
        this.#endedAt = Date.now()
        return response
      } catch (error) {
        console.log('Error:', error)
        this.#endedAt = Date.now()
        return { error }
      }
    }

    throw new LogicException('The app must be a Class or a function')
  }

  bootstrap () {
    if (!this.#app.hasBeenBootstrapped) {
      return this.#app.bootstrapWith(this.bootstrappers)
    }
  }

  terminate () {
    return this.#app.terminate()
  }

  #isFunction (value) {
    return typeof value === 'function'
  }

  #isArrowFunction (value) {
    return this.#isFunction(value) && value.toString().includes('=>') && !value.prototype?.constructor
  }
}