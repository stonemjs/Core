/**
 * Class representing an ErrorHandler.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class ErrorHandler {
  #levels
  #container
  #dontReport
  #reportedError
  #withoutDuplicates

  /**
   * Create an ErrorHandler.
   *
   * @param   {Container}  container - Service container to resolve dependencies.
   * @returns {ErrorHandler}
   */
  static create (container) {
    return new this(container)
  }

  /**
   * Create an ErrorHandler.
   *
   * @param {Container}  container - Service container to resolve dependencies.
   */
  constructor (container) {
    this.#container = container
    this.#reportedError = new Set()
    this.#levels = container.config.get('app.logging.levels', {})
    this.#dontReport = container.config.get('app.logging.dontReport', [])
    this.#withoutDuplicates = container.config.get('app.logging.withoutDuplicates', false)
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
    const logger = this.#container?.has('logger') ? this.#container.make('logger') : console

    logger[level]
      ? logger[level](errorContext, error.message)
      : logger.error(errorContext, error.message)
  }

  #buildErrorContext (error) {
    const context = [{ error }]
    error.context && context.push(error.context)
    error.metadata && context.push(error.metadata)
    return context
  }
}
