import { merge } from '@stone-js/common'

/**
 * Passable.
 *
 * @typedef  {Object} Passable
 * @property {Object} app
 * @property {Object} options
 * @property {Object} commands
 */

/**
 * Handle Main config decorator.
 * Must be the first pipe, in the no config exists.
 * It will make the config file.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const MainConfigPipe = (passable, next) => {
  const module = passable.app.find(module => module.$$metadata$$?.mainHandler)
  const options = module?.$$metadata$$?.mainHandler ?? {}
  passable.options = merge(passable.options ?? {}, options)
  return next(passable)
}

/**
 * Handle Adapter decorator.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const AdapterPipe = (passable, next) => {
  const module = passable.app.find(module => module.$$metadata$$?.adapters)
  const adapters = module?.$$metadata$$?.adapters ?? []
  passable.options.adapters = adapters.concat(passable.options.adapters)
  return next(passable)
}

/**
 * Handle Provider decorator.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const ProviderPipe = (passable, next) => {
  const modules = passable.app.filter(module => module.$$metadata$$?.provider)
  passable.options.app.providers = modules.concat(passable.options.app.providers)
  return next(passable)
}

/**
 * Handle Service decorator.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const ServicePipe = (passable, next) => {
  const modules = passable.app.filter(module => module.$$metadata$$?.service)
  passable.options.app.services = modules.concat(passable.options.app.services)
  return next(passable)
}

/**
 * Handle Listener decorator.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const ListenerPipe = (passable, next) => {
  const modules = passable.app.filter(module => module.$$metadata$$?.listener)
  passable.options.app.listeners = modules.concat(passable.options.app.listeners)
  return next(passable)
}

/**
 * Handle Subscriber decorator.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const SubscriberPipe = (passable, next) => {
  const modules = passable.app.filter(module => module.$$metadata$$?.subscriber)
  passable.options.app.subscribers = modules.concat(passable.options.app.subscribers)
  return next(passable)
}

/**
 * Handle Middleware decorator.
 *
 * @param   {Passable} passable - Input data to transform via middleware.
 * @param   {Function} next - Pass to next middleware.
 * @returns {Passable}
 */
export const MiddlewarePipe = (passable, next) => {
  const modules = passable.app.filter(module => module.$$metadata$$?.middleware)
  passable.options.app.services = modules.concat(passable.options.app.services)
  return next(passable)
}

/**
 * Export core pipes
 *
 * @returns {Function[]}
 */
export const corePipes = [
  MainConfigPipe,
  AdapterPipe,
  ProviderPipe,
  ServicePipe,
  ListenerPipe,
  SubscriberPipe,
  MiddlewarePipe
]
