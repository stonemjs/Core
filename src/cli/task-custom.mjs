import { shouldBuild } from './utils.mjs'
import { buildApp } from './task-build.mjs'
import { importModule } from '@stone-js/common'

/**
 * Custom task.
 *
 * @param   {IncomingEvent} event
 * @param   {Container} container
 * @returns {void}
 */
export const customTask = async (container) => {
  if (shouldBuild(container.config)) {
    await buildApp(container, () => importModule('./.stone/console.bootstrap.mjs'))
  } else {
    await importModule('./.stone/console.bootstrap.mjs')
  }
}
