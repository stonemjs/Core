import deepmerge from 'deepmerge'
import { isConstructor } from '@stone-js/common'

/**
 * Middleware Decorator: Useful for customizing classes as middleware.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options
 * @param  {string} options.name - Platform name.
 * @param  {string} options.platform - Platform name.
 * @param  {boolean} options.singleton - Register as singleton in container.
 * @param  {(string|string[])} options.alias - Alias name and must be unique all over the app.
 * @param  {('adapter', 'kernel', 'router')} options.context - Execution context.
 * @param  {('input', 'output', 'terminate')} options.type - Type determine the middleware's purpose.
 * @return {Function}
 */
export const Middleware = (options) => {
  return (target) => {
    if (!isConstructor(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      middleware: options,
      service: { singleton: true, ...options }
    }

    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
