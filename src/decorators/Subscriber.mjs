import deepmerge from 'deepmerge'

/**
 * Subscriber decorator to mark a class as a listener.
 *
 * @param {object} [configurations={}] - The decorator congiguration keys.
 * @return {any}
 */
export const Subscriber = (value = {}) => {
  return (target) => {
    value ??= {}
    target.metadata = deepmerge(target.metadata ?? {}, { ...value, isSubscriber: true })
    return target
  }
}
