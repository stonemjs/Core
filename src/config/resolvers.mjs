import deepmerge from 'deepmerge'

/**
 * Passable resolver.
 * This resolver allow to convert and dee pmerge an array object to an object.
 * We use it here to build the huge options object from different options modules
 * defined in `config` folder.
 *
 * @param   {string} [key='optons']
 * @returns {Function}
 */
export const passableResolver = (key = 'options') => (passable) => {
  if (Array.isArray(passable[key])) {
    passable[key] = passable[key].reduce((prev, option) => deepmerge(prev, option), {})
  } else if (!passable[key]) {
    passable[key] = {}
  }

  return passable
}
