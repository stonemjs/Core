import { RequestHandled } from '../events/RequestHandled.mjs'
import { DefaultKernel } from './DefaultKernel.mjs'

export class HttpKernel extends DefaultKernel {
  static NAME = 'http'

  #middleware

  #getMiddleware () {
    return this.app.configurations.middleware ?? []
  }

  #getResolveMiddleware () {
    this.#middleware ??= this.#getMiddleware().reduce((prev, curr) => prev.concat([this.app.resolveService(curr)]), [])
    return this.#middleware
  }

  async _beforeRunning () {
    let request = this.app.get('request')
    for (const middleware of this.#getResolveMiddleware()) {
      request = (await middleware.handleRequest(request)) ?? request
    }

    this.app.registerInstance('request', request)

    return request
  }

  async _afterRunning (response) {
    response = super._afterRunning(response)
    for (const middleware of this.#getResolveMiddleware()) {
      response = (await middleware.handleResponse(response)) ?? response
    }

    this.app.notify(RequestHandled, new RequestHandled(this.app.get('request'), response))

    return response
  }
}
