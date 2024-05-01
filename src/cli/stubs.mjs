import { workingDir } from './utils.mjs'
import { outputFileSync } from 'fs-extra/esm'

export const bootstrap = `
import stoneConfig from '../stone.config.mjs'
import { StoneFactory } from '@stone-js/core'
import { ConfigLoader } from '@stone-js/config'

const options = await ConfigLoader.create(stoneConfig).load()

await StoneFactory
  .create(options)
  .hook('onInit', () => stoneConfig.onInit?.())
  .run()
`

export const consoleBootstrap = `
import stoneConfig from '../stone.config.mjs'
import { StoneFactory } from '@stone-js/core'
import { ConfigLoader } from '@stone-js/config'

const options = await ConfigLoader.create(stoneConfig).load()

await StoneFactory
  .create(options)
  .hook('onInit', () => stoneConfig.onInit?.())
  .run('node_console')
`

export function makeBootstrapFile () {
  outputFileSync(workingDir('./.stone/app.bootstrap.mjs'), bootstrap)
}

export function makeConsoleBootstrapFile () {
  outputFileSync(workingDir('./.stone/console.bootstrap.mjs'), consoleBootstrap)
}
