import { Application } from '@stone-js/core'

const output = await Application.launch(({ app }) => {
  return {
    run () {
      console.log('Hello world! This is my awesome application with a default locale:', app.getLocale())
      return 'This is my output' // La valeur de retour
    }
  }
})

/**
 * La valeur retournée par votre application
 * Ca peut être n'importe quoi ou même l'API publique de votre librairie
 */
console.log(output)