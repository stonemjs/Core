export class Launcher {
  #app

  constructor ({ app }) {
    this.#app = app
  }

  launch () {
    return this.#app.kernel.run()
  }
}
