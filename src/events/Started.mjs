import { Event } from './Event.mjs'

export class Started extends Event {
  constructor (app, output) {
    super(app)
    this.output = output
  }
}
