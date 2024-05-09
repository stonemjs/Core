import deepmerge from 'deepmerge'
import { isConstructor } from '@stone-js/common'

/**
 * Subscriber Decorator: Useful for customizing classes as subscriber.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator configuration options.
 * @return {Function}
 */
export const Subscriber = (options = {}) => {
  return (target) => {
    if (!isConstructor(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      subscriber: options
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
