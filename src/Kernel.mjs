import { BootProviders } from './bootstrap/BootProviders.mjs'
import { RegisterProviders } from './bootstrap/RegisterProviders.mjs'
import { LogicException } from './exceptions/LogicException.mjs'

export class Kernel {
  #app
  #endedAt
  #startedAt
  #resolvedUserApp

  constructor ({ app }) {
    this.#app = app
  }

  get app () {
    return this.#app
  }

  get executionDuration () {
    return this.#endedAt - this.#startedAt
  }

  get bootstrappers () {
    return (this.#app.configurations?.bootstrappers ?? [])
      .concat([
        RegisterProviders,
        BootProviders
      ])
      .reduce((prev, curr) => prev.concat(prev.includes(curr) ? [] : [curr]), [])
  }

  async run () {
    const App = this.#app.userDefinedApp

    if (this._isFunction(App)) {
      this.#startedAt = Date.now()
      this.#resolvedUserApp = this._isClass(App) ? new App(this.#app.container) : App(this.#app.container)

      if (!this.#resolvedUserApp?.run) {
        throw new LogicException('The app must have a `run` method')
      }

      let response

      try {
        await this.bootstrap()
        await this._beforeRunning()
        response = await this.#resolvedUserApp.run()
      } catch (error) {
        response = error
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
    if (this.#resolvedUserApp && this.#resolvedUserApp.terminate) {
      return this.#resolvedUserApp.terminate()
    }
  }

  async _beforeRunning () {}

  async _afterRunning (response) {
    if (response?.error && this.#app.isDebug()) {
      console.log('Error:', response)
    }

    return response
  }

  _isFunction (value) {
    return typeof value === 'function'
  }

  _isArrowFunction (value) {
    return this._isFunction(value) && value.toString().includes('=>') && !value.prototype?.constructor
  }

  _isClass (value) {
    return this._isFunction(value) && /^\s*class/.test(value.toString())
  }
}