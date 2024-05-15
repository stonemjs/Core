import { classLevelDecoratorChecker, merge } from '@stone-js/common'

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
    classLevelDecoratorChecker(target)

    const metadata = {
      listener: options
    }

    target.$$metadata$$ = merge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
