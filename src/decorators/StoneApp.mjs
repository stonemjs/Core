import { appOptions } from '@stone-js/core/config'
import { classLevelDecoratorChecker, merge } from '@stone-js/common'

/**
 * Decorators, Useful for decorating classes.
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
 * @param  {Object} [options] - The decorator configuration options.
 * @param  {string} [options.name] - Application name.
 * @param  {string} [options.env] - Application env.
 * @param  {string} [options.debug] - Application debug.
 * @param  {string} [options.timezone] - Define the timezone.
 * @param  {string} [options.locale] - Application locale.
 * @param  {string} [options.fallback_locale] - Application fallback_locale.
 * @param  {(Function[]|Object[])} [options.builder.pipes] - Pipes for config builder.
 * @param  {string[]} [options.builder.reduce] - Modules du reduce and deep merge to object.
 * @param  {number} [options.builder.defaultPipesPriority] - Default priority for all pipes.
 * @param  {string} [options.adapter.current] - Define the current adapter.
 * @return {Function}
 */
export const StoneApp = (options = {}) => {
  return (target) => {
    classLevelDecoratorChecker(target)

    const metadata = {
      provider: {},
      builder: merge(appOptions.builder, {
        pipes: options.builder?.pipes ?? [],
        reduce: options.builder?.reduce ?? [],
        defaultPipesPriority: options.builder?.defaultPipesPriority ?? 10
      }),
      mainHandler: merge(appOptions, { app: options })
    }

    target.$$metadata$$ = merge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
