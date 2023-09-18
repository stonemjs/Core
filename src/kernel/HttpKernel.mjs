export class HttpKernel {
  static NAME = 'http'
  
  #app
  
  constructor (app) {
    this.#app = app
  }
}