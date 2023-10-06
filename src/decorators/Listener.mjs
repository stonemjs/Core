import deepmerge from 'deepmerge'

/**
 * ListenerConfiguration.
 *
 * @typedef  {Object}  ListenerConfiguration
 * @property {boolean} hook
 */

/**
 * Listener decorator to mark a class as a listener.
 *
 * @param {ListenerConfiguration} [configurations={}] - The decorator congiguration keys.
 * @return {any}
 */
export const Listener = (value = {}) => {
  return (target) => {
    value ??= {}
    target.metadata = deepmerge(target.metadata ?? {}, { ...value, isListener: true })
    return target
  }
}
