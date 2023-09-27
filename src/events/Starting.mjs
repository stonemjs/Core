import { Event } from './Event.mjs'

export class Starting extends Event {
  static get alias () { return 'app.starting' }
}
