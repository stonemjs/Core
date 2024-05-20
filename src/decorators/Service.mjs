import { classLevelDecoratorChecker, merge } from '@stone-js/common'

/**
 * Decorators, Useful for decorating classes.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @namespace Decorators
 */

/**
 * Service options.
 *
 * @typedef  {Object} serviceOptions
 * @property {boolean} [singleton]
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
    classLevelDecoratorChecker(target)

    const metadata = {
      service: { singleton: true, ...options }
    }

    target.$$metadata$$ = merge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
