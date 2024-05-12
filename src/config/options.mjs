import { CoreServiceProvider } from '@stone-js/core'

/**
 * Stone main options.
 *
 * @returns {Object}
*/
export const appOptions = {
  // Adapters namespace.
  // Here you can define adapters settings.
  adapters: [],

  // App namespace.
  // Here you can define app settings.
  app: {

    // This value is the name of your application.
    name: 'Stone.js',

    // This value determines the "environment" your application is currently running in.
    env: 'production',

    // This value determines when your application is in debug mode.
    // Useful for showing detailed error messages with stack traces.
    debug: false,

    // This value determines the default timezone for your application.
    timezone: 'UTC',

    // This value determines the default locale for your application.
    locale: 'en',

    // This value determines the fallback locale for your application.
    fallback_locale: 'en',

    // This value is used for encryption purpose all over your application.
    secret: null,

    // Here you can defined the entry point for you application.
    handler: null,

    // Here you can defined common adapter's options.
    adapter: {

      // Here you can set the current adapter alias.
      // This value will be used to determine the adapter at runtime.
      current: null
    },

    // Here you can define global app level setting for all adapters.
    kernel: {

      // Here you can define global app level middleware for all adapters.
      middleware: {

        // All kernel middleware.
        skip: false,

        // Event middleware. Can be class constructor or alias.
        event: [],

        // Response middleware. Can be class constructor or alias.
        response: [],

        // Terminate mapper middleware. Can be class constructor or alias.
        terminate: []
      }
    },

    // Here you can defined logging settings for all adapters.
    logging: {

      // Defined Error class log levels. e.g: { TypeError: 'warn' }.
      levels: {},

      // Error class to not report.  e.g: [TypeError].
      dontReport: [],

      // Should report again a reported Error.
      withoutDuplicates: false
    },

    // Here you can register services for all adapters.
    // This array of services will be automatically registered when this application is started.
    services: [],

    // Here you can register listeners for all adapters.
    // This array of listeners will be automatically registered when this application is started.
    listeners: {},

    // Here you can register subscribers for all adapters.
    // This array of subscribers will be automatically registered when this application is started.
    subscribers: [],

    // Here you can register providers for all adapters.
    // The service providers listed here will be automatically loaded at each request to your application.
    providers: [
      CoreServiceProvider
    ],

    // Here you can register aliases for all adapters.
    // This array of class aliases will be registered when the application is started.
    aliases: {}
  }
}
