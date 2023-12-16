export class ExceptionHandler {
  #levels
  #context
  #dontReport
  #withoutDuplicates
  #reportedException
  #internalDontReport

  constructor ({ context }) {
    this.#context = context

    this.#levels = {}
    this.#dontReport = []
    this.#internalDontReport = []
    this.#withoutDuplicates = false
    this.#reportedException = new Set()
  }

  level (Class, level) {
    this.#levels[Class] = level
    return this
  }

  ignore (Class) {
    this.#dontReport.push(Class)
    return this
  }

  stopIgnoring (Class) {
    this.#dontReport = this.#dontReport.filter(v => v !== Class)
    return this
  }

  dontReportDuplicates () {
    this.#withoutDuplicates = true
    return this
  }

  async report (exception) {
    if (this.shouldReport(exception)) {
      await this._reportException(exception)
    }
    return this
  }

  async _reportException (exception) {
    this.#reportedException.add(exception)

    const level = Object
      .entries(this.#levels)
      .reduce((prev, [Class, item]) => (exception instanceof Class) ? item : prev, 'error')

    const exceptionContext = this._buildExceptionContext(exception)

    this.#context.logger[level]
      ? this.#context.logger[level](exceptionContext, exception.message)
      : this.#context.logger.error(exceptionContext, exception.message)
  }

  _buildExceptionContext (exception) {
    const context = [{ exception }]
    exception.context && context.push(exception.context)
    exception.metadata && context.push(exception.metadata)
    return context
  }

  shouldReport (exception) {
    if (this.#withoutDuplicates && this.#reportedException.has(exception)) {
      return false
    }

    return [...this.#dontReport, ...this.#internalDontReport]
      .reduce((prev, Class) => exception instanceof Class ? false : prev, true)
  }

  async render (exception) {
    if (exception.getResponse) {
      return exception.getResponse()
    }

    return exception
  }
}
