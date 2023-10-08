# StoneJS: Core

![npm](https://img.shields.io/npm/l/@stone-js/core)
![npm](https://img.shields.io/npm/v/@stone-js/core)
![npm](https://img.shields.io/npm/dm/@stone-js/core)
![Maintenance](https://img.shields.io/maintenance/yes/2023)

StoneJS Core provides a simple and powerful environnement to run any applications or libraries by providing a ready to use
IoC service container, event emitter,

Benefits:
- Service container with autobinding and proxy resolver to register and resolve your services
- Event emitter to subscribe to Core events, to emit and listen to your own events
- Default kernel, to run any application
- Service Provider to register your services

## Why must i use StoneCore?
You can use it for any purpose,
1. You canLibrary
2. Vanilla App
3. Backend API
4. Website
5. CLI App
6. Frontend App (SPA, SSR, Jamstack)
7. Live App (Websocket)

## Configuration object
```js
  {
    /**
     * The environnement
     */
    env: 'local', // production, staging, developement

    /**
     * Debug mode
     */
    debug: false,

    /**
     * Current app locale
     */
    locale: 'en',
    
    /**
     * Fallback locale
     */
    fallbackLocale: 'en',
    
    /**
     * User defined application
     * Your application to be launched
     */
    app: null,

    /**
     * List of bootstrappers used to bootstrap the application
     */
    bootstrappers: [],

    /**
     * List of Service providers to register in the Service container
     */
    providers: [],

    /**
     * List of listeners
     * Allowing you to subscribe and listen for various events that occur within your application
     */
    listeners: {
      Booted: [ MyBootedListener ], // Dummy listener for example purpose
      'app.starting': [ MyStartingListener ], // Dummy listener for example purpose
    },

    /**
     * List of subscribers
     * Allowing you to define several event handlers within a single class
     */
    subscribers: [ AppEventSubscriber ], // Dummy subscriber for example purpose

    /**
     * The current launcher used to launch your application
     */
    launcher: 'default',

    /**
     * List of available launchers
     * Feel free to create yours and add it here
     * This is a dummy list, only one launcher exists, the default one
     */
    launchers: {
      http: HttpLauncher,
      repl: REPLLauncher,
      console: ConsoleLauncher,
      default: DefaultLauncher,
      awsLambda: AWSLambdaLauncher,
    },

    /**
     * The current kernel used by the Application
     */
    kernel: 'default',

    /**
     * List of available kernels
     * Feel free to create yours and add it here
     * This is a dummy list, only one kernel exists, the default one
     */
    kernels: {
      http: HttpKernel,
      repl: REPLKernel,
      console: ConsoleKernel,
      default: DefaultKernel
    }
  }
```

## List of events

All the events are located in the events folder, you can use the event class as event name to s
Tous les evenements