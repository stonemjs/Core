import deepmerge from 'deepmerge'
// import { isClass } from '@stone-js/common'

/**
 * Subscriber Decorator: Useful for customizing classes as subscriber.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator congiguration options.
 * @return {Function}
 */
export const Subscriber = (options = {}) => {
  return (target) => {
    // if (!isClass(target)) {
    //   throw new TypeError('This decorator can only be applied at class level.')
    // }

    const metadata = {
      subscriber: options
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
