import deepmerge from 'deepmerge'
import { isClass } from '@stone-js/common'
import { AbstractProvider } from '../AbstractProvider.mjs'

/**
 * ServiceProvider decorator to mark a class as a ServiceProvider
 * and autobind it's services to the container.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator congiguration options.
 * @return {Function}
 */
export const ServiceProvider = (options) => {
  return (target) => {
    if (!isClass(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      serviceProvider: { ...options }
    }

    Reflect.setPrototypeOf(target, AbstractProvider)
    Reflect.setPrototypeOf(target.prototype, AbstractProvider.prototype)

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
