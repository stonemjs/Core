import { RuntimeException } from './RuntimeException.mjs'

/**
 * Class representing a LogicException.
 */
export class LogicException extends RuntimeException {
  static CODE = 'CORE_LOGIC-500'

  constructor (message, metadata = {}) {
    super(message, LogicException.CODE, metadata)
    this.name = 'stone.js.core.logic'
  }
}
