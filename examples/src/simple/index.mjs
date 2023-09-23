import { Application } from '@noowow-community/core'

export const stoneJS = Application
  .default()
  .registerInstance('name', 'Evens Stone')
  .registerService(({ name }) => name, true, ['myName'])
  .run(({ myName }) => {
    return {
      run () {
        console.log('Hello: ', myName)
      }
    }
  })
  .then(app => {
    console.log('App container', app.container.bindings.size)
    console.log('App container aliases', app.container.aliases.size)
  })