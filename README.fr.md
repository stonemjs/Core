# StoneJS: Core

![npm](https://img.shields.io/npm/l/@stone-js/core)
![npm](https://img.shields.io/npm/v/@stone-js/core)
![npm](https://img.shields.io/npm/dm/@stone-js/core)
![Maintenance](https://img.shields.io/maintenance/yes/2023)

StoneJS Core vous offre un environnement simple et puissant pour créer vos projets javascript, qu'il soit un simple projet, une librairie ou une application backend, frontend ou ligne de commande (CLI).
Il met à votre disposition un conteneur de service pour gérer vos dépendances, un gestionnaire d'événement pour gérer vos événements, 
un noyau pour executer votre application et un lanceur pour lancer votre application dans l'environnement approprié (console, browser, http, Cloud, AWS Lambda, etc...).
Toutes les fonctionnalités sont paramétrables, ce qui vous permet d'étendre les fonctionnalités ou d'en inclure d'autres facilement.

## Table of Contents

* [Avantages](#avantages)
* [Pourquoi dois je utiliser StoneJs Core](#pourquoi-dois-je-utiliser-stonejs-Core)
* [Installation](#installation)
* [Utilisation](#utilisation)
    * [Utilisation simple](#utilisation-simple)
    * [Avec le contexte](#avec-le-contexte)
* [Contexte](#contexte)
* [Providers](#providers)
* [Evenements](#evenements)
* [Kernels](#kernels)
* [Launchers](#launchers)
* [Bootstrappers](#bootstrappers)
* [Api](#api)
* [Credits](#credits)

## Avantages:

- Un conteneur de service prêt à l'emploi
- Un gestionnaire d'événement prêt à l'emploi
- Des événements cycle de vie (life cycle hooks) prêt à l'emploi
- Un noyau prêt à l'emploi
- Un lanceur prêt à l'emploi
- Enregistrer vos services sans configuration, c-à-d sans spécifier ses dépendances
- Profiter du pouvoir de l'injection de dépendance automatique et sans configuration
- Profiter de `L'injection de dépendance par decomposition`
- Profiter des événements du cycle de vie pour effectuer des taches au moment opportun
- Executer votre application dans des environnements différents (at runtime)
- Personnaliser le noyau pour repondre à vos besoins
- Personnaliser le lanceur pour repondre à vos besoins
- Personnaliser les bootstrappers pour repondre à vos besoins

## Pourquoi dois je utiliser StoneJs Core

Vous pouvez l'utiliser pour créer:

1. Une librairie (Node, Navigateur)
2. Une application REPL
3. Une application backend (API)
4. Une application frontend (SPA, SSR, Jamstack)
5. Une application en ligne de commande (CLI)
6. Une application en temps réel (RTA)

## Installation

The StoneJS Core can be installed with both `npm` and `yarn`.

```sh
# Install with NPM
$ npm i @stone-js/core

# Install with yarn
$ yarn add @stone-js/core
```

## Utilisation

Vous pouvez lancer votre application via la méthode statique `Application.launch`, il prend soit votre application ou objet de contexte en paramètre.
Votre application peut être une function ou une classe, et doit avoir la méthode `run` sans quoi une exception sera lancée.
La methode `run` doit avoir la logique pour lancer votre application et peut être asynchrone, si elle retourne une valeur, elle sera retourné par la methode `Application.launch`. Si votre application est une function elle doit retourner un objet contenant la méthode `run`.

**Important:** `Application.launch` retourne toujours une Promesse(`Promise`).

Des exemples d'utilisations se trouvent dans le répertoire `examples`.

### Utilisation simple

Le moyen le plus simple d'utilisation c'est de fournir votre application en paramètre à la méthode statique `Application.launch`.

```js
import { Application } from '@stone-js/core'

const output = await Application.launch(({ app }) => {
  return {
    run () {
      console.log('Hello world! This is my awesome application with the default locale:', app.getLocale())
      return 'This is my output' // La valeur de retour
    }
  }
})

/**
 * La valeur retournée par votre application
 * Ca peut être n'importe quoi ou même l'API publique de votre librairie
 */
console.log(output)
```

### Avec le contexte

L'autre moyen c'est de fournir un objet contexte contenant toutes les informations pour lancer votre application.
L'object de contexte est décrit plus bas.

```js
/**
 * Avec le contexte
 * Un exemple plus complet se trouve ici: examples/src/context.mjs, n'hésitez pas de jeter un oeil.
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

Application
  .launch(context)
  .then(output => console.log(output))
  .catch(e => console.log(e))

```


## Contexte

La liste complète des paramètres du contexte

```js
  {
    /**
     * User defined application
     * Your application to be launched
     * Must be the entry point of your application
     */
    app: null,

    /**
     * The environnement
     * Ex: production, staging, developement, local
     */
    env: 'local',

    /**
     * Debug mode
     */
    debug: false,

    /**
     * Current app locale
     */
    locale: 'en',
    
    /**
     * Fallback locale
     */
    fallbackLocale: 'en',

    /**
     * List of bootstrappers used to bootstrap the application
     */
    bootstrappers: [],

    /**
     * List of Service providers to register services in the Service container
     */
    providers: [],

    /**
     * List of bindings to register in the Service container
     */
    bindings: [
      // { name: 'name', value: '', alias: ['name_alias'], singleton: true }
    ],

    /**
     * List of listeners
     * Allowing you to subscribe and listen for various events that occur within your application
     */
    listeners: {
      // Dummy listener for example purpose
      // Booted: [ MyBootedListener ],
      // 'app.starting': [ MyStartingListener ],
    },

    /**
     * List of subscribers
     * Allowing you to define several event handlers within a single class
     */
    subscribers: [
      // Dummy subscriber for example purpose
      // AppEventSubscriber
    ],

    /**
     * The current launcher used to launch your application
     */
    launcher: 'default',

    /**
     * List of avalaible launchers
     * Only the default launcher is provided
     * Feel free to create yours and add it here
     */
    launchers: {
      // This is a dummy list, only one launcher exists, the default one
      // http: HttpLauncher,
      // repl: REPLLauncher,
      // console: ConsoleLauncher,
      // default: DefaultLauncher,
      // awsLambda: AWSLambdaLauncher,
    },

    /**
     * The current kernel used by the Application
     */
    kernel: 'default',

    /**
     * List of avalaible kernels
     * Only the default kernel is provided
     * Feel free to create yours and add it here
     */
    kernels: {
      // This is a dummy list, only one kernel exists, the default one
      // http: HttpKernel,
      // repl: REPLKernel,
      // console: ConsoleKernel,
      // default: DefaultKernel
    }
  }
```

## Evenements

StoneJS Core implemente le gestionnaire d'evenement de nodeJs `EventEmitter` pour gérer ses evenements, 
vous pouvez profiter de la même API pour interagir et gérer les evenements de votre application.

Tous les principaux evenements sont localisés dans le repertoire `src/events`, vous pouvez utiliser les classes comme nom pour abonner aux evenements.

Liste des evenements ainsi que leur alias

| Evenements         |  Alias             |
|--------------------|--------------------|
| SettingUp          | app.settingUp      |
| Setup              | app.setup          |
| Registering        | app.registering    |
| Registered         | app.registered     |
| Booting            | app.booting        |
| Booted             | app.booted         |
| Starting           | app.starting       |
| Started            | app.started        |
| Terminating        | app.terminating    |
| Terminate          | app.terminate      |
| LocaleUpdated      | app.locale.updated |

## Providers


## Kernels


## Launchers


## Evenements


## Bootstrappers


## API

## Credits
- [Laravel](https://github.com/illuminate)