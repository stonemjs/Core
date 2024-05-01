import { buildApp } from './task-build.mjs'
import { importModuleFromCWD, shouldBuild } from './utils.mjs'

/**
 * Custom task.
 *
 * @param   {IncomingEvent} event
 * @param   {Container} container
 * @returns {void}
 */
export const customTask = async (_event, container) => {
  if (shouldBuild(container.config)) {
    await buildApp(container)
  }

  await importModuleFromCWD('./.stone/console.bootstrap.mjs')
}
