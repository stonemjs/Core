import { ProviderEvent } from './ProviderEvent.mjs'

export class Registering extends ProviderEvent {
  static get alias () { return 'app.registering' }
}
