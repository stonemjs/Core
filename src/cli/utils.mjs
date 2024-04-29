import { cwd } from 'node:process'
import { readFileSync } from 'node:fs'

/**
 * Import module from current working directory.
 *
 * @param   {string} relativePath
 * @returns {(Object|null)}
 */
export const importModuleFromCWD = async (relativePath) => {
  try {
    return await import(new URL(relativePath, `file://${cwd()}/`).href)
  } catch (_) {
    return null
  }
}

/**
 * Get package.json.
 *
 * @returns {Object}
 */
export const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
