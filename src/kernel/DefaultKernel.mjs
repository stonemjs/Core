import { BootProviders } from '../bootstrap/BootProviders.mjs'
import { RegisterProviders } from '../bootstrap/RegisterProviders.mjs'
import { LogicException } from '../exceptions/LogicException.mjs'

export class DefaultKernel {
  static NAME = 'default'

  #app
  #endedAt
  #startedAt
  #bootstrappers

  constructor ({ app }) {
    this.#app = app

    this.#bootstrappers = [
      RegisterProviders,
      BootProviders
    ]
  }

  get app () {
    return this.#app
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

      if (!app?.run) {
        throw new LogicException('The app must have a run method')
      }

      let response

      try {
        await this.bootstrap()
        await this._beforeRunning()
        response = await app.run()
      } catch (error) {
        response = { error }
      }

      this.#endedAt = Date.now()

      return await this._afterRunning(response)
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

  async _beforeRunning () {}

  async _afterRunning (response) {
    if (response?.error) {
      console.log('Error:', response.error)
    }

    return response
  }

  #isFunction (value) {
    return typeof value === 'function'
  }

  #isArrowFunction (value) {
    return this.#isFunction(value) && value.toString().includes('=>') && !value.prototype?.constructor
  }
}
