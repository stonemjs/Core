import { ServiceProvider } from './ServiceProvider.mjs'

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
  return ServiceProvider({ ...options, isMainApplication: true })
}
