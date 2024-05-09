import spawn from 'cross-spawn'
import { argv } from 'node:process'
import { shouldBuild } from './utils.mjs'
import { buildApp } from './task-build.mjs'
import { buildPath } from '@stone-js/common'

/**
 * Custom task.
 *
 * @param   {Container} container
 * @param   {IncomingEvent} [event]
 * @returns
 */
export const customTask = async (container) => {
  if (shouldBuild(container)) {
    await buildApp(container, () => startProcess())
  } else {
    startProcess()
  }
}

/**
 * Start Process.
 *
 * @private
 * @returns
 */
function startProcess () {
  spawn('node', [buildPath('console.bootstrap.mjs'), ...argv.slice(2)], { stdio: 'inherit' })
}
