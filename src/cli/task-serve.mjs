import { watch } from 'chokidar'
import { shouldBuild } from './utils.mjs'
import { spawn } from 'node:child_process'
import { buildApp } from './task-build.mjs'
import { basePath, buildPath } from '@stone-js/common'

/**
 * Serve task.
 *
 * @param   {Container} container
 * @param   {IncomingEvent} [event]
 * @returns
 */
export const serveTask = async (container) => {
  let serverProcess

  if (shouldBuild(container.config)) {
    await buildApp(container, () => { serverProcess = startProcess(container, serverProcess) })
  }

  appWatcher(container, async () => {
    await buildApp(container, () => { serverProcess = startProcess(container, serverProcess) })
  })
}

/**
 * App watcher.
 *
 * @private
 * @param   {Container} container
 * @param   {Function} handler
 * @returns
 */
function appWatcher (container, handler) {
  const watcher = watch('.', {
    ignored: ['node_modules/**', 'dist/**', '.stone/**'],
    cwd: basePath(),
    persistent: true,
    ignoreInitial: true,
    followSymlinks: false,
    depth: undefined
  })

  watcher.on('change', async (path) => {
    container.output.info(`File ${path} changed`)
    await handler()
  })

  watcher.on('add', async (path) => {
    container.output.info(`File ${path} has been added`)
    await handler()
  })
}

/**
 * Start Process.
 *
 * @private
 * @param   {Container} container
 * @param   {Object} serverProcess
 * @returns {Object}
 */
function startProcess (container, serverProcess) {
  serverProcess && serverProcess.kill()
  serverProcess = spawn('node', [buildPath('app.bootstrap.mjs')], { stdio: 'inherit' })
  serverProcess.on('close', () => container.output.info('Server process terminated.'))
  return serverProcess
}
