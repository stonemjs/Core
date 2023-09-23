export class ApplicationException extends Error {
  constructor (code, message, metadata = {}) {
    super()
    this.code = code
    this.message = message
    this.metadata = metadata
    this.name = 'stonejs.core.application'
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
