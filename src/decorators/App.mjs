import deepmerge from 'deepmerge'

/**
 * AppConfiguration.
 *
 * @typedef  {Object} AppConfiguration
 * @property {string} kernel
 * @property {string} launcher
 * @property {string} logger
 */

/**
 * App decorator to mark a class as the main application entry point.
 *
 * @param {AppConfiguration} [configurations={}] - The decorator congiguration keys.
 * @return {any}
 */
export const App = (value = {}) => {
  return (target) => {
    value ??= {}
    target.metadata = deepmerge(target.metadata ?? {}, { ...value, isMainApp: true })
    return target
  }
}
