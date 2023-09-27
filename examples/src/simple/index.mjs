import { Application, Booted, Started } from '@stone-js/core'

// const stoneJS = await Application
//   .default()
//   .registerInstance('name', 'Evens Stone')
//   .registerService(({ name }) => name, true, ['myName'])
//   .on(['app.setup', 'app.registering', Booted, Started, 'app.terminate'], (event) => console.log('On event fire', event))
//   .run(({ myName }) => {
//     return {
//       run () {
//         console.log('Hello: ', myName)
//         return (event, ctx) => [event, ctx]
//       }
//     }
//   })


const handler = await Application.launch({
  userDefinedApp () {
    return {
      run () {
        console.log('Hello: ', 'myName')
        return (event, ctx) => [event, ctx]
      }
    }
  },
  onReady (e) {
    console.log('App started', e.app.version)
  }
})

console.log('App result', handler('eventMe', 'CTXMe'))