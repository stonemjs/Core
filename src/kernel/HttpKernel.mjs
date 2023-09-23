import { RequestHandled } from '../events/RequestHandled.mjs'

export class HttpKernel {
  static NAME = 'http'

  #app
  #router
  #startedAt
  #middleware
  #middlewareAliases

  constructor ({ app, router }) {
    this.#app = app
    this.#router = router
    this.#middleware = []
  }

  async handle (request) {
    let response
    this.#startedAt = new Date().getTime()

    try {
      response = await this.#sendRequestThroughRouter(request)
    } catch (error) {
      this.#reportException()
      response = this.#renderException(request, error)
    }

    this.#app.notify(RequestHandled, new RequestHandled(request, response))

    return response
  }

  bootstrap () {}

  terminate (request, response) {}

  getApplication () {
    return this.#app
  }

  async #sendRequestThroughRouter (request) {
    this.#app.container.instance('request', request)

    this.bootstrap()

    const response = await this.#router.dispatch(request)

    return response
  }

  #renderException (request, error) {}

  #reportException () {}
}
