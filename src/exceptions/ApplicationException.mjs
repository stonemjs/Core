/**
 * Class representing a ApplicationException.
 */
export class ApplicationException extends Error {
  static CODE = 'CORE-500'

  constructor (message, code = ApplicationException.CODE, metadata = {}) {
    super()
    this.code = code
    this.message = message
    this.metadata = metadata
    this.name = 'stonejs.core'
  }

  /**
   * The ResponseException allow to normalize response.
   *
   * @typedef  {Object}         ResponseException
   * @property {boolean}        error
   * @property {number|string}  code
   * @property {string}         name
   * @property {string}         content
   * @property {Object}         metadata
   */

  /**
   * Get Error as a ResponseException's Object.
   *
   * @return {ResponseException}.
   */
  getResponse () {
    return {
      error: true,
      code: this.code,
      name: this.name,
      content: this.message,
      metadata: this.metadata
    }
  }
}
