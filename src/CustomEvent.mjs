/**
 * Class representing an CustomEvent.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 */
export class CustomEvent {
  /**
   * Create an CustomEvent.
   *
   * @param {string} name - The event name.
   * @param {*} context - The event context.
   * @param {*} [data=null] - The event data.
   */
  constructor (name, context, data = null) {
    this.name = name
    this.data = data
    this.context = context
  }
}
