import deepmerge from 'deepmerge'
import { isConstructor } from '@stone-js/common'

/**
 * Decorators, usefull for decorating classes.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @namespace Decorators
 */

/**
 * Service options.
 *
 * @typedef  {Object} serviceOptions
 * @property {string} name
 * @property {boolean} singleton
 * @property {(string|string[])} alias
 */

/**
 * Service decorator to mark a class as a service
 * and autobind it to the container.
 *
 * @memberOf Decorators
 * @param  {serviceOptions} options - The decorator congiguration options.
 * @return {Function}
 */
export const Service = (options) => {
  return (target) => {
    if (!isConstructor(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      service: { singleton: true, ...options }
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
