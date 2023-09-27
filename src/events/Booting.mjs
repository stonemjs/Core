import { ProviderEvent } from './ProviderEvent.mjs'

export class Booting extends ProviderEvent {
  static get alias () { return 'app.booting' }
}
