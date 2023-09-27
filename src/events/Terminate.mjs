import { Event } from './Event.mjs'

export class Terminate extends Event {
  static get alias () { return 'app.terminate' }
}
