import deepmerge from 'deepmerge'
import { isConstructor } from '@stone-js/common'

/**
 * Listener Decorator: Useful for customizing classes as listener.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options
 * @param  {string} options.event
 * @return {Function}
 */
export const Listener = (options) => {
  return (target) => {
    if (!isConstructor(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      listener: options
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
