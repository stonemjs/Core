import { Event } from './Event.mjs'

export class SettingUp extends Event {
  static get alias () { return 'app.settingUp' }
}
