import { LogicError } from '@stone-js/common'

/**
 * Class representing an AbstractProvider.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class AbstractProvider {
  #container

  /**
   * Create a new instance of Provider.
   *
   * @param {Container} container
   */
  constructor (container) {
    this.#container = container
  }

  get container () {
    return this.#container
  }

  get config () {
    return this.#container.config
  }

  /**
   * Register any application services.
   *
   * @return {this}
   * @throws {LogicError}
   */
  register () {
    throw new LogicError('Cannot call this abstract method.')
  }

  /**
   * Bootstrap any application services.
   *
   * @return {this}
   * @throws {LogicError}
   */
  boot () {
    throw new LogicError('Cannot call this abstract method.')
  }
}
