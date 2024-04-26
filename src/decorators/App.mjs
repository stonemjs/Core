import deepmerge from 'deepmerge'
import { isClass } from '@stone-js/common'

/**
 * Decorators, usefull for decorating classes.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @namespace Decorators
 */

/**
 * App Decorator: Useful for customizing classes as the main application entry point.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator congiguration options.
 * @param  {string} options.name - Application name.
 * @return {Function}
 */
export const App = (options) => {
  return (target) => {
    if (!isClass(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      mainHandler: options
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
