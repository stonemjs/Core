import { importModule } from '@stone-js/common'

/**
 * Get stone config options.
 * Every Stone.js App must have a `stone.config.mjs`
 * file at the root of the project.
 * Use this function to get this module.
 *
 * @param   {boolean} throwException
 * @returns {(Object|null)}
 */
export const getStoneOptions = async (throwException = true) => {
  const options = await importModule('./stone.config.mjs') ?? await importModule('./stone.config.js')

  if (!options && throwException) {
    throw new TypeError('You must defined a `stone.config.mjs` file at the root of your application.')
  }

  return options ? Object.values(options).shift() : null
}
