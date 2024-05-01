import { emptyDirSync } from 'fs-extra/esm'
import { Pipeline } from '@stone-js/pipeline'
import { setCache, workingDir } from './utils.mjs'
import { rollupBuild, rollupBundle } from './rollupjs.mjs'
import { makeBootstrapFile, makeConsoleBootstrapFile } from './stubs.mjs'

const buildPipes = [
  pipeable((container) => container.output.info('Changes detected, building...')),
  pipeable(() => emptyDirSync(workingDir('./.stone'))),
  pipeable((container) => rollupBuild(container.config)),
  pipeable((container) => setCache(container.config)),
  pipeable(() => makeBootstrapFile()),
  pipeable(() => makeConsoleBootstrapFile())
]

const bundlePipes = [
  pipeable((container) => container.output.info('Bundling...')),
  pipeable(() => emptyDirSync(workingDir('./dist'))),
  pipeable(() => rollupBundle())
]

function pipeable (handler) {
  return async (container, next) => {
    await handler(container)
    next(container)
  }
}

/**
 * Build app.
 *
 * @param   {Container} container
 * @returns {void}
 */
export async function buildApp (container) {
  await Pipeline
    .create()
    .send(container)
    .through(buildPipes)
    .thenReturn()
}

/**
 * Bundle app.
 *
 * @param   {Container} container
 * @returns {void}
 */
export async function bundleApp (container) {
  await Pipeline
    .create()
    .send(container)
    .through(bundlePipes)
    .thenReturn()
}

/**
 * Build task.
 *
 * @param   {IncomingEvent} event
 * @param   {Container} container
 * @returns {void}
 */
export async function buildTask (_event, container) {
  await Pipeline
    .create()
    .send(container)
    .through(buildPipes.concat(bundlePipes))
    .thenReturn()
}
