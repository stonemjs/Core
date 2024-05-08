import { Config } from '@stone-js/config'
import { Mapper } from '@stone-js/adapters'
import { version } from '../../package.json'
import { buildTask } from './task-build.mjs'
import { serveTask } from './task-serve.mjs'
import { customTask } from './task-custom.mjs'
import { mapperInputResolver } from './resolvers.mjs'
import { Container } from '@stone-js/service-container'
import { CommonInputMiddleware } from './middleware.mjs'

/**
 * Class representing a Stone.js console Handler.
 *
 * @version 0.0.1
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class Handler {
  #container

  /**
   * Create a Stone.js console handler.
   *
   * @param   {Object} options - Stone.js configuration options.
   * @returns {Handler}
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create a Stone.js console handler.
   *
   * @param {Object} options - Stone.js configuration options.
   */
  constructor (options) {
    this.#container = new Container()
    this.#container.instance(Config, Config.create(options)).alias(Config, 'config')
    this.#container.singleton('inputMapper', (container) => Mapper.create(container, [CommonInputMiddleware], mapperInputResolver))
  }

  /** @return {Container} */
  get container () {
    return this.#container
  }

  /**
   * Hook that runs at each events and before everything.
   * Useful to initialize things at each events.
   */
  beforeHandle () {
    this.#command(this.#container.builder)
  }

  /**
   * Handle IncomingEvent.
   *
   * @param   {IncomingEvent} event
   * @returns
   */
  async handle (event) {
    switch (event.get('task')) {
      case 'build':
        await buildTask(this.#container, event)
        break
      case 'serve':
        await serveTask(this.#container, event)
        break
      default:
        await customTask(this.#container, event)
        break
    }
  }

  /**
   * Command builder.
   *
   * @param {Yargs} builder - Yargs command builder.
   */
  #command (builder) {
    builder
      .command({
        command: 'build',
        aliases: ['b'],
        desc: 'Build project'
      })
      .command({
        command: 'serve',
        aliases: ['s'],
        desc: 'Serve project'
      })
      .help()
      .version(version)
  }
}
