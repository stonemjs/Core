import http from 'http'
import { LogicException } from '../exceptions/LogicException.mjs'

export class NodeHttpLauncher {
  #app

  constructor (app) {
    this.#app = app
  }

  get #server () {
    try {
      const url = new URL(this.#app.get('app.url', 'http://localhost:8080'))
      return {
        baseUrl: url,
        port: url.port ?? 8080,
        scheme: url.protocol ?? 'http',
        hostname: url.hostname ?? 'localhost',
        debug: this.#app.get('app.debug', false),
        locale: this.#app.get('app.locale', 'en'),
        env: this.#app.get('app.env', 'production'),
        fallback_locale: this.#app.get('app.fallback_locale', 'en')
      }
    } catch (error) {
      throw new LogicException('Invalid configuration', error)
    }
  }

  async launch () {
    return new Promise((resolve) => {
      http
        .createServer(async (req, res) => {
          const request = await Request.createFromNodeRequest(req, this.#server)
          this.#app.registerInstance(Request, request)
          const response = await this.kernel.run()
          res.writeHead(response.statusCode, response.headers)
          response.isEmpty() ? res.end() : res.end(response.getContent())
        })
        .listen(
          this.#server.port,
          this.#server.hostname,
          () => {
            resolve()
            console.log('Server started at:', this.#server.baseUrl)
          }
        )
    })
  }
}
