import { Pipeline } from '@stone-js/pipeline'

/**
 * Class representing a ConfigBuilder.
 * Constructing and configuring the dynamic
 * Complex strucred options for StoneFactory.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class ConfigBuilder {
  #pipes
  #passable
  #passableResolver
  #destinationResolver

  /**
   * Create an ConfigBuilder.
   *
   * @param   {Object} passable
   * @param   {Array}  pipes
   * @returns {ConfigBuilder}
   */
  static create (passable, pipes) {
    return new this(passable, pipes)
  }

  /**
   * Create an ConfigBuilder.
   *
   * @param {Object} passable
   * @param {Array}  pipes
   */
  constructor (passable, pipes) {
    this.#pipes = pipes
    this.#passable = passable
  }

  /**
   * Set passable resolver.
   *
   * @param   {Function} resolver
   * @returns {this}
   */
  setPassableResolver (resolver) {
    this.#passableResolver = resolver
    return this
  }

  /**
   * Set destination resolver.
   *
   * @param   {Function} resolver
   * @returns {this}
   */
  setDestinationResolver (resolver) {
    this.#destinationResolver = resolver
    return this
  }

  /**
   * Build config
   *
   * @returns {Object}
   */
  build () {
    return Pipeline
      .create()
      .send(this.#preparePassable(this.#passable))
      .through(this.#pipes)
      .then((v) => this.#prepareDestination(v))
  }

  /**
   * Prepare passable.
   *
   * @param   {Object} passable
   * @returns {Object}
   */
  #preparePassable (passable) {
    return this.#passableResolver?.(passable) ?? passable
  }

  /**
   * Prepare config destination.
   *
   * @param   {Object} passable
   * @returns {Object}
   */
  #prepareDestination (passable) {
    return this.#destinationResolver?.(passable) ?? passable
  }
}
