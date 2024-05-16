import { merge } from '@stone-js/common'
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
   * @param   {Object} [options]
   * @returns {ConfigBuilder}
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create a ConfigBuilder.
   *
   * @param {Object} [options]
   */
  constructor (options) {
    this.#options = options
  }

  /**
   * Build config.
   *
   * @param   {Object} modules
   * @param   {Object} modules.app
   * @param   {Object} modules.options
   * @param   {Object} modules.commands
   * @returns {Object}
   */
  async build (modules) {
    const passable = {}

    // We group the imported modules by names.
    // We Convert their values from object to array.
    for (const [name, value] of Object.entries(modules)) {
      passable[name] = Object.values(value)
    }

    // Make builder options from modules if not exists.
    this.#options = this.#makeOptions(passable)

    // Mapping the dynamic complex structured options required by StoneFactory.
    return Pipeline
      .create()
      .defaultPriority(this.#options.defaultPipesPriority)
      .send(this.#passableResolver(passable))
      .through(this.#options.pipes)
      .then((v) => v.options)
  }

  /**
   * Passable resolver.
   * This resolver allow to convert and deep merge an array object to an object.
   * We use it here to build the huge options object from different options modules
   * defined in `config` folder.
   *
   * @param   {Object} passable
   * @returns {Function}
   */
  #passableResolver (passable) {
    return []
      .concat(this.#options.reduce ?? ['options'])
      .reduce((modules, name) => {
        if (Array.isArray(modules[name])) {
          modules[name] = modules[name].reduce((prev, option) => merge(prev, option), {})
        } else if (!modules[name]) {
          modules[name] = {}
        }
        return modules
      }, passable)
  }

  /**
   * Make builder options if not exists.
   *
   * @param   {Object} passable
   * @returns {Object}
   */
  #makeOptions (passable) {
    if (!this.#options) {
      this.#options = Object
        .values(passable)
        .flatMap((modules) => modules)
        .reduce((options, module) => {
          return merge(options, module.builder ?? module.$$metadata$$?.builder ?? {})
        }, { pipes: [], reduce: [] })
    }

    return this.#options
  }
}
