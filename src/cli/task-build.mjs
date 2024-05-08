import { setCache } from './utils.mjs'
import { emptyDirSync } from 'fs-extra/esm'
import { Pipeline } from '@stone-js/pipeline'
import { buildPath, distPath } from '@stone-js/common'
import { rollupBuild, rollupBundle } from './rollupjs.mjs'
import { makeBootstrapFile, makeConsoleBootstrapFile } from './stubs.mjs'

const buildPipes = [
  pipeable((container) => container.output.info('Changes detected, building...')),
  pipeable(() => emptyDirSync(buildPath())),
  pipeable((container) => rollupBuild(container.config)),
  pipeable((container) => setCache(container.config)),
  pipeable(() => makeBootstrapFile()),
  pipeable(() => makeConsoleBootstrapFile()),
  pipeable((container) => container.output.info('Build finished'))
]

const bundlePipes = [
  pipeable((container) => container.output.info('Bundling...')),
  pipeable(() => emptyDirSync(distPath())),
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
export function buildApp (container, onComplete) {
  return Pipeline
    .create()
    .send(container)
    .through(buildPipes)
    .then((passable) => onComplete(passable))
}

/**
 * Bundle app.
 *
 * @param   {Container} container
 * @returns {void}
 */
export function bundleApp (container, onComplete) {
  return Pipeline
    .create()
    .send(container)
    .through(bundlePipes)
    .then((passable) => onComplete(passable))
}

/**
 * Build task.
 *
 * @param   {IncomingEvent} event
 * @param   {Container} container
 * @returns {void}
 */
export function buildTask (container) {
  return Pipeline
    .create()
    .send(container)
    .through(buildPipes.concat(bundlePipes))
    .thenReturn()
}
