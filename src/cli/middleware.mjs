/**
 * Common input middleware.
 *
 * @param   {Object} passable
 * @param   {Function} next
 * @returns {Object}
 */
export const CommonInputMiddleware = (passable, next) => {
  passable.event.metadata = passable.message
  passable.event.metadata.task = passable.message._extra.shift()
  return next(passable)
}
