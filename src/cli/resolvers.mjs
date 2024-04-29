import { IncomingEvent } from '@stone-js/common'

/**
 * Mapper input resolver.
 *
 * @param   {Object} passable
 * @returns {IncomingEvent}
 */
export const mapperInputResolver = (passable) => IncomingEvent.create(passable.event)
