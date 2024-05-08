import { shouldBuild } from './utils.mjs'
import { buildApp } from './task-build.mjs'
import { importModule } from '@stone-js/common'

/**
 * Custom task.
 *
 * @param   {Container} container
 * @param   {IncomingEvent} [event]
 * @returns
 */
export const customTask = async (container) => {
  if (shouldBuild(container.config)) {
    await buildApp(container, () => importModule('./.stone/console.bootstrap.mjs'))
  } else {
    await importModule('./.stone/console.bootstrap.mjs')
  }
}
