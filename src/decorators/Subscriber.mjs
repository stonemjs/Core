import { classLevelDecoratorChecker, merge } from '@stone-js/common'

/**
 * Subscriber Decorator: Useful for customizing classes as subscriber.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} [options] - The decorator configuration options.
 * @return {Function}
 */
export const Subscriber = (options = {}) => {
  return (target) => {
    classLevelDecoratorChecker(target)

    const metadata = {
      subscriber: options
    }

    target.$$metadata$$ = merge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
