import { ApplicationException } from './ApplicationException.mjs'

export class LogicException extends ApplicationException {
  static CODE = 500

  constructor (message, metadata = {}) {
    super(LogicException.CODE, message, metadata)
    this.name = 'stonejs.core.logic'
  }
}
