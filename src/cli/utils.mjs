import { globSync } from 'glob'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { readJsonSync, pathExistsSync, outputJsonSync } from 'fs-extra/esm'

/**
 * Import module from current working directory.
 *
 * @param   {string} relativePath
 * @returns {(Object|null)}
 */
export async function importModuleFromCWD (relativePath) {
  try {
    return await import(new URL(relativePath, `file://${cwd()}/`).href)
  } catch (_) {
    return null
  }
}

/**
 * Resolve path from current working directory.
 *
 * @param   {...string} paths
 * @returns {string}
 */
export function workingDir (...paths) {
  return join(cwd(), ...paths)
}

/**
 * Get Application Files.
 * Will return all application files
 * groupped by directory.
 * Configurations are set in `stone.config.mjs`
 * at the root of the application directory.
 *
 * @param   {Config} config
 * @returns {Array}
 */
export function getApplicationFiles (config) {
  return Object
    .entries(config.get('autoload.modules'))
    .map(([name, pattern]) => [name, globSync(workingDir(pattern))])
}

/**
 * Get File Hash.
 * Create a file hash for caching purpose.
 *
 * @param   {string} filename
 * @returns {string}
 */
export function getFileHash (filename) {
  return createHash('md5').update(readFileSync(filename)).digest('hex')
}

/**
 * Get cache.
 * Application files's cache memory.
 *
 * @param   {Config} config
 * @returns {Object}
 */
export function getCache () {
  return pathExistsSync(workingDir('./.stone/.cache'))
    ? readJsonSync(workingDir('./.stone/.cache'), { throws: false })
    : {}
}

/**
 * Set cache.
 * Application files's cache memory.
 *
 * @param   {Config} config
 * @returns {void}
 */
export function setCache (config) {
  const cache = getCache()

  getApplicationFiles(config)
    .reduce((prev, [_, files]) => prev.concat(files), [])
    .forEach((filePath) => {
      cache[filePath] = getFileHash(filePath)
    })

  outputJsonSync(workingDir('./.stone/.cache'), cache)
}

/**
 * Should build application.
 * Will return `true` if anything has changed
 * from the last build.
 *
 * @param   {Config} config
 * @returns {boolean}
 */
export function shouldBuild (config) {
  const cache = getCache()

  return getApplicationFiles(config)
    .reduce((prev, [_, files]) => prev.concat(files), [])
    .reduce((prev, filePath, _, files) => {
      if (prev) return prev
      return Object.keys(cache).filter(v => !files.includes(v)).length > 0 || !cache[filePath] || cache[filePath] !== getFileHash(filePath)
    }, false)
}
