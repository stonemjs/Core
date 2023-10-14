import { Application } from '../../src/index.mjs'

/**
 * Your application as a function
 * Destructuring Dependency Injection
 */
const myApp = async ({ appName, app_name, userService }) => {
  console.log('Hello world! My awesome application name is:', appName)
  console.log('And this is my users:', await userService.getUsers())

  return `This is my output with an alias from function: ${app_name}`
}

/**
 * Your application as a class
 */
class AppModule {
  /**
   * Destructuring Dependency Injection
   */
  constructor ({ appName, app_name, userService, config }) {
    this.config = config
    this.appName = appName
    this.app_name = app_name
    this.userService = userService
  }

  async run () {
    console.log('Hello world! My awesome application name is:', this.appName)
    console.log('And this is my users:', await this.userService.getUsers())
    console.log('App configs with configuration manager', this.config.get('app'))
    // throw new Error('My bad')
    return `This is my output with an alias from class: ${this.app_name}`
  }
}

/**
 * User service
 */
class UserService {
  async getUsers () {
    return [
      { fullname: 'Jonh Doe', email: 'jonh.doe@stonejs.com' },
      { fullname: 'Jane Doe', email: 'jane.doe@stonejs.com' },
      { fullname: 'Jack Doe', email: 'jack.doe@stonejs.com' },
    ]
  }
}

/**
 * Service provider
 */
class AppServiceProvider {
  constructor ({ app }) {
    this.app = app
  }

  register () {
    this.app.registerService(UserService, true, ['userService'])
  }
}

/**
 * An Event listener
 */
class AppStartedEventListener {
  /**
   * Destructuring Dependency Injection
   */
  constructor ({ appName }) {
    this.appName = appName
  }

  handle(event) {
    console.log(`MyApp(${this.appName}) started event from EventListener`)
    console.log('The event name', event.name)
  }
}

/**
 * An Hook listener
 */
class AppSettingUpHookListener {
  /**
   * Only [app, container, EventEmitter, ExceptionHandler] are availables
   */
  constructor ({ app }) {
    this.app = app
  }

  handle(event) {
    console.log(`MyApp version(${this.app.version}) started event from HookListener`)
    console.log('The hook event name', event.name)
  }
}

/**
 * Any configs
 */
const configs = {
  license: 'MIT',
  author: 'Mr. Stone',
}

/**
 * Items to bind to Container
 */
const bindings = [
  { name: 'appName', value: 'My StoneJS App', alias: ['app_name'] }
].concat(
  Object.entries(configs).map(([name, value]) => ({ name, value }))
)

/**
 * The app execution configurations
 */
const configurations = {
  app: {
    debug: true,
    bindings,
    appModule: AppModule, // or use: myApp,
    providers: [ AppServiceProvider ],
    listeners: {
      'app.started': [ AppStartedEventListener ]
    },
    hookListeners: {
      'app.settingUp': [ AppSettingUpHookListener ],
    }
  }
}

/**
 * Launch app
 */
Application
  .launch(configurations)
  .then(output => console.log('Ouput:', output))