import { Handler } from './Handler.mjs'
import { NodeConsoleAdapter } from '@stone-js/adapters'

/**
 * Class representing a Stone.js console App.
 *
 * @version 0.0.1
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class App {
  #options

  /**
   * Create a Stone.js console application and run it.
   *
   * @param   {Object} options - Stone.js configuration options.
   * @returns {Void}
   */
  static createAndRun (options) {
    return this.create(options).run()
  }

  /**
   * Create a Stone.js console application.
   *
   * @param   {Object} options - Stone.js configuration options.
   * @returns {App}
   */
  static create (options) {
    return new this(options)
  }

  /**
   * Create a Stone.js console application.
   *
   * @param {Object} options - Stone.js configuration options.
   */
  constructor (options) {
    this.#options = options
  }

  /**
   * Run handler.
   *
   * @returns {Void}
   * @throws  {RuntimeError}
   */
  run () {
    NodeConsoleAdapter.createAndRun(() => Handler.create(this.#options))
  }
}
