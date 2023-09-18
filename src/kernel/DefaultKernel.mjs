export class DefaultKernel {
  static NAME = 'default'
  
  #app
  
  constructor (app) {
    this.#app = app
  }
}