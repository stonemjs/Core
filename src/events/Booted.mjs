import { ProviderEvent } from './ProviderEvent.mjs'

export class Booted extends ProviderEvent {
  static get alias () { return 'app.booted' }
}
