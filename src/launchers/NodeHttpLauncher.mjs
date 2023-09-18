import http from 'http'
import { LogicException } from "../exceptions/LogicException.mjs"

export class NodeHttpLauncher {
  #app
  #kernel = 'http'

  constructor (app) {
    this.#app = app
  }

  #getKernel () {
    if (this.#app.hasKernel(this.#kernel)) {
      return this.#app.getKernel(this.#kernel)
    }
    throw new LogicException(`No kernel registered for this name ${this.#kernel}`)
  }

  get #server () {
    try {
      const url = new URL(this.#app.get('config.app.url', 'http://localhost:8080'))
      return {
        baseUrl: url,
        port: url.port ?? 8080,
        scheme: url.protocol ?? 'http',
        hostname: url.hostname ?? 'localhost',
        debug: this.#app.get('config.app.debug', false),
        locale: this.#app.get('config.app.locale', 'en'),
        env: this.#app.get('config.app.env', 'production'),
        fallback_locale: this.#app.get('config.app.fallback_locale', 'en'),
      }
    } catch (error) {
      throw new LogicException(`Invalid configuration`, e)
    }
  }

  async launch () {
    return http
      .createServer(async (req, res) => {
        const request = await Request.createFromNodeRequest(req, this.#server)
        const response = await this.#getKernel.dispatch(request)
        res.writeHead(response.statusCode, response.headers)
        response.isEmpty() ? res.end() : res.end(response.getContent())
      })
      .listen(
        this.#server.port,
        this.#server.hostname,
        () => console.log('Server started at:', this.#server.baseUrl)
      )
  }
}