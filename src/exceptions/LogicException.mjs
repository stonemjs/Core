import { ApplicationException } from './ApplicationException.mjs'

export class LogicException extends ApplicationException {
  static CODE = 'CORE_LOGIC-500'

  constructor (message, metadata = {}) {
    super(message, LogicException.CODE, metadata)
    this.name = 'stonejs.core.logic'
  }
}
