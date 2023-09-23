import { ApplicationException } from './ApplicationException.mjs'

export class LogicException extends ApplicationException {
  static CODE = 500

  constructor (message) {
    super(LogicException.CODE, message)
    this.name = 'stonejs.core.logic'
  }
}
