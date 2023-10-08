import deepmerge from 'deepmerge'

/**
 * ListenerConfiguration.
 *
 * @typedef  {Object}  ListenerConfiguration
 * @property {string}  event                  - The event name to listen to
 * @property {boolean} hook                   - Listen for hook events
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
    target.metadata.hook ??= false
    return target
  }
}
