import spawn from 'cross-spawn'
import { watch } from 'chokidar'
import { shouldBuild } from './utils.mjs'
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

  if (shouldBuild(container)) {
    await buildApp(container, () => { serverProcess = startProcess(serverProcess) })
  } else {
    serverProcess = startProcess(serverProcess)
  }

  appWatcher(async () => {
    await buildApp(container, () => { serverProcess = startProcess(serverProcess) })
  })
}

/**
 * App watcher.
 *
 * @private
 * @param   {Function} handler
 * @returns
 */
function appWatcher (handler) {
  const watcher = watch('.', {
    ignored: ['node_modules/**', 'dist/**', '.stone/**'],
    cwd: basePath(),
    persistent: true,
    ignoreInitial: true,
    followSymlinks: false,
    depth: undefined
  })

  watcher.on('change', async (path) => {
    console.info(`File ${path} changed`)
    await handler()
  })

  watcher.on('add', async (path) => {
    console.info(`File ${path} has been added`)
    await handler()
  })
}

/**
 * Start Process.
 *
 * @private
 * @param   {Object} serverProcess
 * @returns {Object}
 */
function startProcess (serverProcess) {
  serverProcess && serverProcess.kill()
  serverProcess = spawn('node', [buildPath('app.bootstrap.mjs')], { stdio: 'inherit' })
  serverProcess.on('close', () => console.info('Server process terminated.'))
  return serverProcess
}
