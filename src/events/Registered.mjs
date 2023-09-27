import { ProviderEvent } from './ProviderEvent.mjs'

export class Registered extends ProviderEvent {
  static get alias () { return 'app.registered' }
}
