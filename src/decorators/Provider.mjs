import { classLevelDecoratorChecker, merge } from '@stone-js/common'

/**
 * Provider decorator to mark a class as a ServiceProvider
 * and autobind it's services to the container.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator configuration options.
 * @return {Function}
 */
export const Provider = (options = {}) => {
  return (target) => {
    classLevelDecoratorChecker(target)

    const metadata = {
      provider: { ...options }
    }

    target.$$metadata$$ = merge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
