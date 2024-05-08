import { shouldBuild } from './utils.mjs'
import { buildApp } from './task-build.mjs'
import { rollupWatch } from './rollupjs.mjs'
import { importModule } from '@stone-js/common'

/**
 * Serve task.
 *
 * @param   {IncomingEvent} event
 * @param   {Container} container
 * @returns {void}
 */
export const serveTask = async (container) => {
  if (shouldBuild(container.config)) {
    await buildApp(container, () => importModule('./.stone/app.bootstrap.mjs'))
  } else {
    await importModule('./.stone/app.bootstrap.mjs')
    rollupWatch(container.config)
  }
}
