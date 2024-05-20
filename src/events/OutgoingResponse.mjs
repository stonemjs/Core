import { Event } from './Event.mjs'

/**
 * Class representing an OutgoingResponse.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @extends Event
 */
export class OutgoingResponse extends Event {
  /**
   * OUTGOING_RESPONSE Event name, fires on reponse to the incoming event.
   *
   * @type {Symbol}
   * @event OutgoingResponse#OUTGOING_RESPONSE
   */
  static OUTGOING_RESPONSE = Symbol('stonejs@outgoing_response')

  /**
   * Create an OutgoingResponse.
   *
   * @param   {*} content
   * @param   {string} [statusCode=null]
   * @param   {string} [statusMessage=null]
   * @param   {Object} [source=null]
   * @returns {OutgoingResponse}
   */
  static create (content, statusCode = null, statusMessage = null, source = null, type = OutgoingResponse.OUTGOING_RESPONSE) {
    return new this(content, statusCode, statusMessage, source, type)
  }

  /**
   * Create an OutgoingResponse.
   *
   * @param {*} content
   * @param {string} [statusCode=null]
   * @param {string} [statusMessage=null]
   * @param {Object} [source=null]
   */
  constructor (content, statusCode = null, statusMessage = null, source = null, type = OutgoingResponse.OUTGOING_RESPONSE) {
    super(type, source)
    this._content = content
    this._statusCode = statusCode
    this._originalContent = content
    this._statusMessage = statusMessage
  }

  /** @returns {*} */
  get content () {
    return this._content
  }

  /** @returns {*} */
  get originalContent () {
    return this._originalContent
  }

  /** @returns {number} */
  get statusCode () {
    return this._statusCode
  }

  /** @returns {string} */
  get statusMessage () {
    return this._statusMessage
  }

  /**
   * Prepare response before send it.
   *
   * @param   {IncomingEvent} event
   * @returns {this}
   */
  prepare (_event) {
    return this
  }
}
