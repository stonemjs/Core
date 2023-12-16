import { Event } from './Event.mjs'
import { isClass, isFunction } from './utils.mjs'
import { BootProviders } from './bootstrap/BootProviders.mjs'
import { LogicException } from './exceptions/LogicException.mjs'
import { RegisterProviders } from './bootstrap/RegisterProviders.mjs'

export class Kernel {
  #context
  #endedAt
  #startedAt
  #resolvedAppModule

  constructor ({ context }) {
    this.#context = context
  }

  get executionDuration () {
    return this.#endedAt - this.#startedAt
  }

  get bootstrappers () {
    return [RegisterProviders, BootProviders]
      .concat(this.#context.config.get('app.bootstrappers', []))
      .reduce((prev, curr) => prev.concat(prev.includes(curr) ? [] : curr), [])
  }

  async run () {
    const App = this.#context.appModule

    if (isFunction(App)) {
      let output

      this.#startedAt = Date.now()

      await this.#bootstrap()

      try {
        await this._beforeRunning()
        this.#resolvedAppModule = isClass(App) ? new App(this.#context.container) : await App(this.#context.container)
        output = this.#resolvedAppModule?.run ? (await this.#resolvedAppModule.run()) : this.#resolvedAppModule
      } catch (error) {
        await this._reportException(error)
        output = await this._renderException(error)
      }

      this.#endedAt = Date.now()

      return await this._afterRunning(output)
    }

    throw new LogicException('The app module must be a Class or a function')
  }

  terminate () {
    if (this.#resolvedAppModule?.terminate) {
      return this.#resolvedAppModule.terminate()
    }
  }

  async _beforeRunning () {
    this.#context.emit(Event.KERNEL_RUNNING, new Event(Event.KERNEL_RUNNING, this.#context))
  }

  async _afterRunning (output) {
    this.#context.emit(Event.KERNEL_RAN, new Event(Event.KERNEL_RAN, this.#context, output))
    return output
  }

  async _reportException (exception) {
    const handler = this.#context.get('exceptionHandler')
    if (handler) {
      await handler.report(exception)
    } else if (this.#context.isDebug()) {
      console.log(exception)
    }
    return this
  }

  async _renderException (exception) {
    const handler = this.#context.get('exceptionHandler')
    return handler ? handler.render(exception) : exception
  }

  #bootstrap () {
    if (!this.#context.hasBeenBootstrapped) {
      return this.#context.bootstrapWith(this.bootstrappers)
    }
  }
}
