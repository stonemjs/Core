import { Config } from '@stone-js/config'
import { packageJson } from './utils.mjs'
import { testTask } from './task-test.mjs'
import { Mapper } from '@stone-js/adapters'
import { buildTask } from './task-build.mjs'
import { serveTask } from './task-serve.mjs'
import { customTask } from './task-custom.mjs'
import { mapperInputResolver } from './resolvers.mjs'
import { Container } from '@stone-js/service-container'
import { CommonInputMiddleware } from './middleware.mjs'

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
   * @returns {void}
   */
  async handle (event) {
    switch (event.get('task')) {
      case 'build':
        await buildTask(event, this.#container)
        break
      case 'serve':
        await serveTask(event, this.#container)
        break
      case 'test':
        await testTask(event, this.#container)
        break
      default:
        await customTask(event, this.#container)
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
        command: 'serve [adapter]',
        aliases: ['s'],
        desc: 'Serve project with hot reloading'
      })
      .command({
        command: 'test',
        aliases: ['t'],
        desc: 'Execute tests'
      })
      .help()
      .version(packageJson.version)
  }
}
