import { Event } from './Event.mjs'

export class Setup extends Event {
  static get alias () { return 'app.setup' }
}
