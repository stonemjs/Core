export class Event {
  static SETUP_HOOK = 'stonejs@hook.setup'
  static STARTED_HOOK = 'stonejs@hook.started'
  static STARTING_HOOK = 'stonejs@hook.starting'
  static TERMINATE_HOOK = 'stonejs@hook.terminate'
  static SETTING_UP_HOOK = 'stonejs@hook.settingUp'
  static TERMINATING_HOOK = 'stonejs@hook.terminating'

  static KERNEL_RAN = 'stonejs@kernel.ran'
  static KERNEL_RUNNING = 'stonejs@kernel.running'

  static LOCALE_UPDATED = 'stonejs@locale.updated'

  static PROVIDER_BOOTED = 'stonejs@provider.booted'
  static PROVIDER_BOOTING = 'stonejs@provider.booting'
  static PROVIDER_REGISTERED = 'stonejs@provider.registered'
  static PROVIDER_REGISTERING = 'stonejs@provider.registering'

  constructor (name, context, data = null) {
    this.name = name
    this.data = data
    this.context = context
  }
}
