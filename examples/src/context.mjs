import { Application } from '@stone-js/core'

/**
 * The execution context
 */
const context = {
  app ({ appName, app_name }) {
    return {
      run () {
        console.log('Hello world! My awesome application name is:', appName)
        return `This is my output with an alias: ${app_name}`
      }
    }
  },
  bindings: [
    { name: 'appName', value: 'My StoneJS App', alias: ['app_name'] }
  ],
  listeners: {
    'app.starting': [
      () => ({ handle() { console.log('MyApp starting event') }})
    ]
  }
}

/**
 * Launch app
 */
Application
  .launch(context)
  .then(output => console.log(output))
  .catch(e => console.log(e))