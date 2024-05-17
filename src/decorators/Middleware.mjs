import { classLevelDecoratorChecker, merge } from '@stone-js/common'

/**
 * Middleware Decorator: Useful for customizing classes as middleware.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options
 * @param  {string} options.platform - Platform name.
 * @param  {number} options.priority - Execution priority.
 * @param  {boolean} options.singleton - Register as singleton in container.
 * @param  {(string|string[])} options.alias - Alias name and must be unique all over the app.
 * @param  {('adapter', 'kernel', 'router')} options.layer - Execution layer.
 * @param  {('input', 'output', 'terminate')} options.type - Type determine the middleware's purpose.
 * @return {Function}
 */
export const Middleware = (options) => {
  return (target) => {
    classLevelDecoratorChecker(target)

    const metadata = {
      middleware: options,
      service: { singleton: true, ...options }
    }

    target.$$metadata$$ = merge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
