import { Service } from './Service.mjs'

/**
 * Injectable decorator to mark a class as a service
 * and autobind it to the container.
 *
 * @author Mr. Stone <evensstone@gmail.com>
 *
 * @memberOf Decorators
 * @param  {serviceOptions} options - The decorator congiguration options.
 * @return {Function}
 */
export const Injectable = Service
