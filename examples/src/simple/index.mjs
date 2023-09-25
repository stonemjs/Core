import { Application, Booted, Started } from '@noowow-community/core'

const stoneJS = await Application
  .default()
  .registerInstance('name', 'Evens Stone')
  .registerService(({ name }) => name, true, ['myName'])
  .on(['app.setup', 'app.registering', Booted, Started, 'app.terminate'], (event) => console.log('On event fire', event))
  .run(({ myName }) => {
    return {
      run () {
        console.log('Hello: ', myName)
        return (event, ctx) => [event, ctx]
      }
    }
  })

console.log('App result', stoneJS('eventMe', 'CTXMe'))