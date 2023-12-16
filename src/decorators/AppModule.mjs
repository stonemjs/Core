import deepmerge from 'deepmerge'

/**
 * AppConfiguration.
 *
 * @typedef  {Object} AppConfiguration
 * @property {string} kernel
 * @property {string} adapter
 * @property {string} logger
 */

/**
 * App decorator to mark a class as the main application entry point.
 *
 * @param {AppConfiguration} [configurations={}] - The decorator congiguration keys.
 * @return {any}
 */
export const AppModule = (value = {}) => {
  return (target) => {
    value ??= {}
    target.metadata = deepmerge(target.metadata ?? {}, { ...value, isAppModule: true })
    return target
  }
}
