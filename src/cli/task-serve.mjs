import { exec } from 'node:child_process'
import { rollupWatch } from './rollupjs.mjs'
import { buildApp } from './task-build.mjs'
import { shouldBuild, workingDir } from './utils.mjs'

/**
 * Serve task.
 *
 * @param   {IncomingEvent} event
 * @param   {Container} container
 * @returns {void}
 */
export const serveTask = async (event, container) => {
  if (shouldBuild(container.config)) {
    await buildApp(container)
  }

  const options = {
    stdio: 'inherit', // This will pipe the output of the tests to the console
    env: process.env // Pass current environment variables to the child process
  }

  rollupWatch(container.config)

  const child = exec(`node ${workingDir('./.stone/app.bootstrap.mjs')}`, options)

  child.on('exit', code => {
    console.log(`App exited with code ${code}`)
    if (code !== 0) {
      console.error('Tests failed')
    } else {
      console.log('Tests passed successfully')
    }
  })

  child.on('error', error => {
    console.error('Failed to start App:', error)
  })
}
