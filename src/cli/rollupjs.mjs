import { rollup } from 'rollup'
import deepmerge from 'deepmerge'
import babel from '@rollup/plugin-babel'
import multi from '@rollup/plugin-multi-entry'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import nodeExternals from 'rollup-plugin-node-externals'
import { basePath, buildPath, distPath } from '@stone-js/common'

/**
 * Rollup build.
 *
 * @param   {Config} config
 * @returns
 */
export async function rollupBuild (config) {
  const options = makeBuildOptions(config.get('autoload.modules'), config.get('rollupOtions', {}))

  for (const option of options) {
    const bundle = await rollup(option)
    await Promise.all(option.output.map(bundle.write))
  }
}

/**
 * Rollup bundle.
 *
 * @returns
 */
export async function rollupBundle () {
  const options = makeBundleOptions()
  const bundle = await rollup(options)
  await Promise.all(options.output.map(bundle.write))
}

/**
 * Make Rollup build options.
 *
 * @private
 * @param   {Object} inputs
 * @param   {Object} [options={}]
 * @returns {Object}
 */
function makeBuildOptions (inputs, options = {}) {
  return Object.entries(inputs).map(([name, input]) => deepmerge({
    input: basePath(input),
    output: [
      { format: 'es', file: buildPath(`${name}.mjs`) }
    ],
    plugins: [
      multi(),
      nodeExternals({ deps: false }), // Must always be before `nodeResolve()`.
      nodeResolve(),
      babel({ babelHelpers: 'bundled' }),
      commonjs()
    ]
  }, options))
}

/**
 * Make Rollup bundle options.
 *
 * @private
 * @param   {Object} inputs
 * @param   {Object} [options={}]
 * @returns {Object}
 */
function makeBundleOptions () {
  return {
    input: buildPath('app.bootstrap.mjs'),
    output: [
      { format: 'es', file: distPath('stone.mjs') }
      // { format: 'es', file: distPath('stone.mjs'), plugins: terser() }
    ],
    plugins: [
      nodeExternals({ deps: false }), // Must always be before `nodeResolve()`.
      nodeResolve(),
      babel({ babelHelpers: 'bundled' }),
      commonjs()
    ]
  }
}
