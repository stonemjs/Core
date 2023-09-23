export class DefaultLauncher {
  #app

  constructor ({ app }) {
    this.#app = app
  }

  launch () {
    return this.#app.kernel.run()
  }
}