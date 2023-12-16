export class Event {
  static SETUP_HOOK = 'app.hook.setup'
  static STARTED_HOOK = 'app.hook.started'
  static STARTING_HOOK = 'app.hook.starting'
  static TERMINATE_HOOK = 'app.hook.terminate'
  static SETTING_UP_HOOK = 'app.hook.settingUp'
  static TERMINATING_HOOK = 'app.hook.terminating'

  static KERNEL_RAN = 'app.kernel.ran'
  static KERNEL_RUNNING = 'app.kernel.running'

  static LOCALE_UPDATED = 'app.locale.updated'

  static PROVIDER_BOOTED = 'app.provider.booted'
  static PROVIDER_BOOTING = 'app.provider.booting'
  static PROVIDER_REGISTERED = 'app.provider.registered'
  static PROVIDER_REGISTERING = 'app.provider.registering'

  constructor (name, context, data = null) {
    this.name = name
    this.data = data
    this.context = context
  }
}
