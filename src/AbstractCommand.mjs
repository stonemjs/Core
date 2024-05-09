import { LogicError } from '@stone-js/common'

/**
 * Class representing an AbstractCommand.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class AbstractCommand {
  /**
   * Create a new instance of Provider.
   *
   * @param {Container} container
   */
  constructor (container) {
    this.container = container
  }

  /** @return {Config} */
  get config () {
    return this.container.config
  }

  /** @return {ConsoleInput} */
  get input () {
    return this.container.input
  }

  /** @return {ConsoleOutput} */
  get output () {
    return this.container.output
  }

  /** @return {Object} chalk instance. */
  get format () {
    return this.container.format
  }

  /** @return {Object} yargs instance. */
  get builder () {
    return this.container.builder
  }

  /** @return {Object} metadata. */
  get metadata () {
    return this.$$metadata$$ ?? {}
  }

  /**
   * IncomingEvent task matches this command.
   *
   * @param   {IncomingEvent} event
   * @returns {boolean}
   */
  match (event) {
    return event.get('task') === this.metadata.name || [].concat(this.metadata.alias).includes(event.get('task'))
  }

  /**
   * Register command.
   *
   * @returns
   */
  registerCommand () {
    this
      .builder
      .command({
        command: [].concat(this.metadata.name, this.metadata.args ?? []).join(' '),
        aliases: [].concat(this.metadata.alias ?? []),
        desc: this.metadata.desc,
        builder: this.metadata.options ?? {}
      })
  }

  /**
   * Handle IncomingEvent.
   *
   * @param   {IncomingEvent} event
   * @returns
   */
  handle (event) {
    throw new LogicError('Cannot call this abstract method.')
  }
}
