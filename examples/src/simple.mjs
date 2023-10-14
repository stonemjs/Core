import { Application } from '../../src/index.mjs'

const output = await Application.launch(async ({ app }) => {
  console.log('Binding keys', [...app.container.bindings.keys()])
  console.log('alias keys', [...app.container.aliases.entries()])
  console.log('Hello world! This is my awesome application with a default locale:', app.getLocale())
  // throw new Error('My errrrroooooorrr')
  return 'This is my output' // La valeur de retour
})

/**
 * La valeur retournée par votre application
 * Ca peut être n'importe quoi ou même l'API publique de votre librairie
 */
console.log(output)