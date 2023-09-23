import { Application } from '@noowow-community/core'

const stoneJS = await Application
  .default()
  .registerInstance('name', 'Evens Stone')
  .registerService(({ name }) => name, true, ['myName'])
  .run(({ myName }) => {
    return {
      run () {
        console.log('Hello: ', myName)
        return (event, ctx) => [event, ctx]
      }
    }
  })

console.log('App result', stoneJS('eventMe', 'CTXMe'))