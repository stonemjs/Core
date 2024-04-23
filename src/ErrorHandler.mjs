/**
 * Class representing an ErrorHandler.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class ErrorHandler {
  #levels
  #logger
  #dontReport
  #reportedError
  #withoutDuplicates

  /**
   * Options.
   *
   * @typedef  ErrorHandlerOptions
   * @property {Object} levels - Level per Error class.
   * @property {Array} [dontReport=[]] - Error to not report.
   * @property {boolean} [withoutDuplicates=false] - Do not report duplicate error.
   */

  /**
   * Create an ErrorHandler.
   *
   * @param   {Object} [logger=null] - Logger.
   * @param   {ErrorHandlerOptions} [options={}] - Configuration options.
   * @returns {ErrorHandler}
   */
  static create (logger = null, options = {}) {
    return new this(logger, options)
  }

  /**
   * Create an ErrorHandler.
   *
   * @param {Object} [logger=null] - Logger.
   * @param {ErrorHandlerOptions} [options={}] - Configuration options.
   */
  constructor (logger = null, options = {}) {
    this.#logger = logger ?? console
    this.#levels = options.levels ?? {}
    this.#reportedError = new Set()
    this.#dontReport = options.dontReport ?? []
    this.#withoutDuplicates = options.withoutDuplicates ?? false
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

  reportDuplicates () {
    this.#withoutDuplicates = false
    return this
  }

  dontReportDuplicates () {
    this.#withoutDuplicates = true
    return this
  }

  shouldReport (error) {
    if (this.#withoutDuplicates && this.#reportedError.has(error)) {
      return false
    }

    return this.#dontReport.filter(Class => error instanceof Class).length === 0
  }

  report (error) {
    if (this.shouldReport(error)) {
      this.#reportError(error)
    }
    return this
  }

  render (error) {
    const code = error.code
    const status = error.statusCode ?? 500
    const message = error.body ?? 'An unexpected error has occurred.'

    return {
      code,
      status,
      message
    }
  }

  async #reportError (error) {
    this.#reportedError.add(error)

    const level = Object.entries(this.#levels).find(([Class]) => error instanceof Class)?.[1] ?? 'error'

    const errorContext = this.#buildErrorContext(error)

    this.#logger[level]
      ? this.#logger[level](errorContext, error.message)
      : this.#logger.error(errorContext, error.message)
  }

  #buildErrorContext (error) {
    const context = [{ error }]
    error.context && context.push(error.context)
    error.metadata && context.push(error.metadata)
    return context
  }
}
