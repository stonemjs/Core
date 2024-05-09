import deepmerge from 'deepmerge'
import { isConstructor } from '@stone-js/common'

/**
 * Command Decorator: Useful for customizing classes as Command.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {Object} options - The decorator congiguration options.
 * @return {Function}
 */
export const Command = (options = {}) => {
  return (target) => {
    if (!isConstructor(target)) {
      throw new TypeError('This decorator can only be applied at class level.')
    }

    const metadata = {
      command: options
    }

    target.prototype.$$metadata$$ = options
    target.$$metadata$$ = deepmerge(target.$$metadata$$ ?? {}, metadata)

    return target
  }
}
