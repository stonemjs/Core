import { defaultPipes } from './pipes.mjs'
import { passableResolver } from './resolvers.mjs'
import { ConfigBuilder } from './ConfigBuilder.mjs'

/**
 * Class representing a ConfigLoader.
 * Load the complex strucred options for StoneFactory.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class ConfigLoader {
  #options

  /**
   * Create an ConfigLoader.
   *
   * @param   {Object} options
   * @returns {ConfigLoader}
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create an ConfigLoader.
   *
   * @param {Object} options
   */
  constructor (options) {
    this.#options = options
  }

  /**
   * Load config
   *
   * @param   {Object} modules
   * @param   {Object} modules.app
   * @param   {Object} modules.options
   * @param   {Object} modules.commands
   * @returns {Object}
   */
  async load (modules) {
    const passable = {}
    const pipes = this.#options.autoload?.skipDefaultPipes
      ? (this.#options.autoload?.pipes ?? [])
      : defaultPipes.concat(this.#options.autoload?.pipes ?? [])

    for (const [name, value] of Object.entries(modules)) {
      passable[name] = Object.values(value)
    }

    return ConfigBuilder
      .create(passable, pipes)
      .setPassableResolver(passableResolver())
      .setDestinationResolver((v) => v.options)
      .build()
  }
}
