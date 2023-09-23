import { Event } from './Event.mjs'

export class Started extends Event {
  constructor (app, response) {
    super(app)
    this.response = response
  }
}
