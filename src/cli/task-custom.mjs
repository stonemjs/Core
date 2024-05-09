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
export const customTask = async (container, _event, showHelp = false) => {
  if (shouldBuild(container)) {
    await buildApp(container, () => startProcess(showHelp))
  } else {
    startProcess(showHelp)
  }
}

/**
 * Start Process.
 *
 * @private
 * @param {boolean} showHelp
 * @returns
 */
function startProcess (showHelp) {
  const args = showHelp ? ['--help'] : argv.slice(2)
  spawn('node', [buildPath('console.bootstrap.mjs'), ...args], { stdio: 'inherit' })
}
