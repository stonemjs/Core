import { Event } from './Event.mjs'

export class Terminating extends Event {
  static get alias () { return 'app.terminating' }
}
