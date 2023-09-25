export class ApplicationException extends Error {
  static CODE = 'CORE-500'

  constructor (message, code = ApplicationException.CODE, metadata = {}) {
    super()
    this.code = code
    this.message = message
    this.metadata = metadata
    this.name = 'stonejs.core'
  }

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
