import deepmerge from 'deepmerge'
import { defaultPipes } from './pipes.mjs'
import { Pipeline } from '@stone-js/pipeline'

/**
 * Class representing a ConfigBuilder.
 * Constructing and configuring the dynamic
 * Complex structured options for StoneFactory.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class ConfigBuilder {
  #options

  /**
   * Create a ConfigBuilder.
   *
   * @param   {Object} options
   * @returns {ConfigBuilder}
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create a ConfigBuilder.
   *
   * @param {Object} options
   */
  constructor (options) {
    this.#options = options
  }

  /**
   * Build config
   *
   * @param   {Object} modules
   * @param   {Object} modules.app
   * @param   {Object} modules.options
   * @param   {Object} modules.commands
   * @returns {Object}
   */
  async build (modules) {
    const passable = {}

    // Determine if default pipes must be skipped or not.
    const pipes = this.#options.autoload?.skipDefaultPipes
      ? (this.#options.autoload?.pipes ?? [])
      : defaultPipes.concat(this.#options.autoload?.pipes ?? [])

    // We group the imported modules by names.
    // We Convert their values from object to array.
    for (const [name, value] of Object.entries(modules)) {
      passable[name] = Object.values(value)
    }

    // Mapping the dynamic complex structured options required by StoneFactory.
    return Pipeline
      .create()
      .send(this.#passableResolver(passable))
      .through(pipes)
      .then((v) => v.options)
  }

  /**
   * Passable resolver.
   * This resolver allow to convert and dee pmerge an array object to an object.
   * We use it here to build the huge options object from different options modules
   * defined in `config` folder.
   *
   * @param   {Object} passable
   * @param   {string} [key='optons']
   * @returns {Function}
   */
  #passableResolver (passable, key = 'options') {
    if (Array.isArray(passable[key])) {
      passable[key] = passable[key].reduce((prev, option) => deepmerge(prev, option), {})
    } else if (!passable[key]) {
      passable[key] = {}
    }
    return passable
  }
}
