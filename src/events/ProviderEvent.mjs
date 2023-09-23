export class ProviderEvent extends Event {
  constructor (app, provider) {
    super(app)
    this.provider = provider
  }
}