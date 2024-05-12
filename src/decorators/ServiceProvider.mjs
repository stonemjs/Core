import deepmerge from 'deepmerge'
import { classLevelDecoratorChecker } from '@stone-js/common'

/**
 * ServiceProvider decorator to mark a class as a ServiceProvider
 * and autobind it's services to the container.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator configuration options.
 * @return {Function}
 */
export const ServiceProvider = (options = {}) => {
  return (target) => {
    classLevelDecoratorChecker(target)

    const metadata = {
      serviceProvider: { ...options }
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
