import { buildPath } from '@stone-js/common'
import { outputFileSync } from 'fs-extra/esm'

/**
 * App boostrap module stub.
 *
 * @returns {string}
 */
export const bootstrap = `
import * as modules from './modules.mjs'
import * as options from './options.mjs'
import { StoneFactory } from '@stone-js/core'
import { ConfigLoader } from '@stone-js/config'
import { getStoneOptions } from '@stone-js/common'

/**
 * Get stone config options.
 */
const stoneOptions = await getStoneOptions()

/**
 * Get app options.
 */
const appOptions = await ConfigLoader.create(stoneOptions).load({ modules, options })

/**
 * Run application.
 */
const app = await StoneFactory
  .create(appOptions)
  .hook('onInit', () => stoneOptions.onInit?.())
  .run()

export { app }
`

/**
 * Console App boostrap module stub.
 *
 * @returns {string}
 */
export const consoleBootstrap = `
import * as modules from './modules.mjs'
import * as options from './options.mjs'
import { StoneFactory } from '@stone-js/core'
import { ConfigLoader } from '@stone-js/config'
import { getStoneOptions } from '@stone-js/common'
import { NODE_CONSOLE_PLATFORM } from '@stone-js/adapters'

/**
 * Get stone config options.
 */
const stoneOptions = await getStoneOptions()

/**
 * Get app options.
 */
const appOptions = await ConfigLoader.create(stoneOptions).load({ modules, options })

/**
 * Run application.
 */
await StoneFactory
  .create(appOptions)
  .hook('onInit', () => stoneOptions.onInit?.())
  .run(NODE_CONSOLE_PLATFORM)
`

/**
 * Make App boostrap module from stub.
 *
 * @returns
 */
export function makeBootstrapFile () {
  outputFileSync(buildPath('app.bootstrap.mjs'), bootstrap)
}

/**
 * Make Console App boostrap module from stub.
 *
 * @returns
 */
export function makeConsoleBootstrapFile () {
  outputFileSync(buildPath('console.bootstrap.mjs'), consoleBootstrap)
}
