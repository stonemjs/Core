import { Event } from './Event.mjs'

export class Started extends Event {
  static get alias () { return 'app.started' }

  constructor (app, output) {
    super(app)
    this.output = output
  }
}
