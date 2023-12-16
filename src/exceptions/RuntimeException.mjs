/**
 * Class representing a RuntimeException.
 */
export class RuntimeException extends Error {
  static CODE = 'CORE-500'

  constructor (message, code = RuntimeException.CODE, metadata = {}, previous = null) {
    super()
    this.code = code
    this.message = message
    this.metadata = metadata
    this.previous = previous
    this.name = 'stone.js.core.runtime'
  }
}
