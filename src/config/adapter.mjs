export const adapter = {
  // Adapters namespace
  adapters: [{
    // App namespace
    app: {

      // Adapter options to be merged with global adapter options.
      adapter: {

        // Here you can define your adapter alias name
        alias: null,

        // Here you can define your default adapter
        default: false,

        // Adapter class constructor.
        type: null,

        // Dom event to listen to.
        // Only in browser
        events: [],

        // Use this to get the target selector where the eventlistener will be attached.
        // Only in browser
        targetSelector: [],

        // Base url to run the app.
        url: 'http://localhost:8080',

        // Node server configs
        server: {}
      },

      // Here you can define global app level setting for this adapter.
      kernel: {

        // Here you can define global app level middleware for this adapter.
        middleware: {

          // Event middleware. Can be class constructor or alias.
          event: [],

          // Response middleware. Can be class constructor or alias.
          response: [],

          // Terminate mapper middleware. Can be class constructor or alias.
          terminate: []
        }
      },

      // Adapter mapper options.
      mapper: {

        // Input mapper options.
        // Use this mapper for incomming platform event.
        input: {

          // Mapper class constructor.
          type: null,

          // Input mapper resolve
          resolver: null,

          // Input mapper middleware. Can be class constructor or alias.
          // Middleware must be registered before using it in the app middleware array.
          middleware: []
        },

        // Output mapper options.
        // Use this mapper for outgoing app response.
        output: {

          // Mapper class constructor.
          type: null,

          // Output mapper resolve
          resolver: null,

          // Output mapper middleware. Can be class constructor or alias.
          // Middleware must be registered before using it in the app middleware array.
          middleware: []
        }
      },

      // Here you can defined logging settings for this adapters.
      logging: {

        // Defined Error class log levels. e.g: { TypeError: 'warn' }.
        levels: {},

        // Error class to not report.  e.g: [TypeError].
        dontReport: [],

        // Should report again a reported Error.
        withoutDuplicates: false
      },

      // Here you can register middleware for this adapter.
      // This array of middleware will be automatically registered when this application is started.
      middleware: [],

      // Here you can register your application commands.
      // This array of services will be automatically registered when this application is started.
      commands: [],

      // Here you can register services for all adapters.
      // This array of services will be automatically registered when this application is started.
      services: [],

      // Here you can register providers for this adapter.
      // The service providers listed here will be automatically loaded at each request to your application.
      providers: [],

      // Here you can register alias for this adapter.
      // This array of class aliases will be registered when the application is started.
      aliases: {}
    }
  }]
}
