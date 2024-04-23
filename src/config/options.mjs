export const app = {
  name: 'Stone.js',
  env: 'production',
  debug: false,
  url: 'http://localhost:8080',
  timezone: 'UTC',
  locale: 'en',
  fallback_locale: 'en',
  secret: null,
  cipher: 'AES-256-CBC',
  adapter: {
    options: {},
    current: null
  },
  runner: null,
  logger: null,
  errorHandler: {
    levels: {},
    dontReport: [],
    withoutDuplicates: false
  },
  adapters: [
    {
      alias: null,
      adapter: null,
      mapper: {
        input: {
          resolver: null,
          middleware: []
        },
        output: {
          resolver: null,
          middleware: []
        }
      }
    }
  ],
  middleware: [],
  providers: [],
  aliases: []
}