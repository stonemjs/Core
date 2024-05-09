import { setCache } from './utils.mjs'
import { emptyDirSync } from 'fs-extra/esm'
import { Pipeline } from '@stone-js/pipeline'
import { buildPath, distPath } from '@stone-js/common'
import { rollupBuild, rollupBundle } from './rollupjs.mjs'
import { makeBootstrapFile, makeConsoleBootstrapFile } from './stubs.mjs'

/** @returns {pipeable[]} */
const buildPipes = [
  pipeable(() => console.info('Building...')),
  pipeable(() => emptyDirSync(buildPath())),
  pipeable((container) => rollupBuild(container.config)),
  pipeable((container) => setCache(container.config)),
  pipeable(() => makeBootstrapFile()),
  pipeable(() => makeConsoleBootstrapFile()),
  pipeable(() => console.info('Build finished'))
]

/** @returns {pipeable[]} */
const bundlePipes = [
  pipeable(() => console.info('Bundling...')),
  pipeable(() => emptyDirSync(distPath())),
  pipeable(() => rollupBundle())
]

/**
 * Build task.
 *
 * @param   {Container} container
 * @param   {IncomingEvent} [event]
 * @returns {*}
 */
export function buildTask (container) {
  return Pipeline
    .create()
    .send(container)
    .through(buildPipes.concat(bundlePipes))
    .thenReturn()
}

/**
 * Build app.
 *
 * @param   {Container} container
 * @param   {Function} onComplete
 * @returns {*}
 */
export function buildApp (container, onComplete) {
  return Pipeline
    .create()
    .send(container)
    .through(buildPipes)
    .then((passable) => onComplete(passable))
}

/**
 * Pipeable.
 *
 * @param   {Function} handler
 * @returns {Function}
 */
function pipeable (handler) {
  return async (container, next) => {
    await handler(container)
    next(container)
  }
}
