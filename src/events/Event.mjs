export class Event {
  constructor (app) {
    this.app = app
  }

  get name () {
    return this.constructor.alias ?? 'Unknown'
  }
}
