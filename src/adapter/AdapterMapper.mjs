import { Pipeline } from '@stone-js/pipeline'

/**
 * Interface for representing a Middleware.
 *
 * @typedef  Middlewareable
 * @property {Function} handle - Will be invoked by the pipeline.
 */

/**
 * Input data to transform through middleware.
 *
 * @typedef  Passable
 * @property {Object} message - Platform-specific incomming message.
 * @property {Object} response - Platform-specific outgoing response.
 * @property {Object} event - Stone.js incomingEvent's constructor options.
 * @property {(OutgoingResponse|OutgoingHttpResponse)} result - Stone.js response.
 */

/**
 * Class representing an AdapterMapper.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class AdapterMapper {
  #container
  #middleware
  #destinationResolver

  /**
   * Create an AdapterMapper.
   *
   * @param   {Container}  container - Service container to resolve dependencies.
   * @param   {(Middlewareable[]|string[])} middleware - Middleware to transform data. Must be a class or a function or an alias.
   * @param   {Function} destinationResolver - Function to resolve destination data.
   * @returns {AdapterMapper}
   */
  static create (container, middleware, destinationResolver) {
    return new this(container, middleware, destinationResolver)
  }

  /**
   * Create an AdapterMapper.
   *
   * @param {Container}  container - Service container to resolve dependencies.
   * @param {(Middlewareable[]|string[])} middleware - Middleware to transform data. Must be a class or a function or an alias.
   * @param {Function} destinationResolver - Function to resolve destination data.
   */
  constructor (container, middleware, destinationResolver) {
    this.#container = container
    this.#middleware = middleware
    this.#destinationResolver = destinationResolver
  }

  /**
   * Transform platform-specific input into IncomingEvent
   * or OutgoingResponse to platform-specific output.
   *
   * @param   {Passable} passable - Input data to transform via middleware.
   * @returns {(IncomingEvent|IncomingHttpEvent|Object)}
   */
  map (passable) {
    return Pipeline
      .create(this.#container)
      .send(this.#preparePassable(passable))
      .through(this.#middleware)
      .then((v) => this.#destinationResolver(v))
  }

  /**
   * Prepare passable.
   *
   * @param   {Passable} passable - Input data to transform via middleware.
   * @returns {Passable}
   */
  #preparePassable (passable) {
    passable.event ??= {}
    passable.response ??= {}
    return passable
  }
}
