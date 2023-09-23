export class DefaultLauncher {
  #app

  constructor ({ app }) {
    this.#app = app
  }

  async launch () {
    await this.#app.kernel.run()
    return this.#app
  }
}
