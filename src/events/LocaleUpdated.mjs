export class LocaleUpdated {
  static get alias () { return 'app.locale.updated' }

  constructor (locale) {
    this.locale = locale
  }
}
