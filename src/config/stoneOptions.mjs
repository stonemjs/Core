import { importModule, merge } from '@stone-js/common'

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
  let options = await importModule('./stone.config.mjs') ?? await importModule('./stone.config.js')
  let cliOptions = await importModule('./cli.config.mjs') ?? await importModule('./cli.config.js')

  if (!options && throwException) {
    throw new TypeError('You must defined a `stone.config.mjs` file at the root of your application.')
  }

  options = options ? Object.values(options).shift() : null
  cliOptions = cliOptions ? Object.values(cliOptions).shift() : null

  return options ? merge(options ?? {}, cliOptions ?? {}) : options
}
