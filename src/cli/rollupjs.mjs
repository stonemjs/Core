import { rollup, watch } from 'rollup'
import deepmerge from 'deepmerge'
import babel from '@rollup/plugin-babel'
import { workingDir } from './utils.mjs'
import terser from '@rollup/plugin-terser'
import multi from '@rollup/plugin-multi-entry'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import nodeExternals from 'rollup-plugin-node-externals'

/**
 * Rollup build.
 *
 * @param   {Config} config
 * @returns {void}
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
 * @returns {void}
 */
export async function rollupBundle () {
  const options = makeBundleOptions()
  const bundle = await rollup(options)
  await Promise.all(options.output.map(bundle.write))
}

/**
 * Rollup watch.
 *
 * @param   {Config} config
 * @returns {void}
 */
export function rollupWatch (config) {
  const options = makeBuildOptions(config.get('autoload.modules'), config.get('rollupOtions', {}))
  const watcher = watch(options)

  watcher.on('event', ({ result }) => {
    if (result) {
      result.close()
    }
  })

  watcher.on('change', (id, { event }) => {
    console.log('on change', id)
  })

  watcher.on('restart', () => {
    console.log('on restart')
  })

  watcher.on('close', () => {
    console.log('on close')
  })
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
    input: workingDir(input),
    output: [
      { format: 'es', file: workingDir(`.stone/${name}.mjs`) }
    ],
    watch: {
      include: workingDir(input),
      exclude: './node_modules/**',
      clearScreen: false
    },
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
    input: workingDir('.stone/app.bootstrap.mjs'),
    output: [
      { format: 'es', file: workingDir('dist/stone.mjs'), plugins: terser() }
    ],
    plugins: [
      nodeExternals({ deps: false }), // Must always be before `nodeResolve()`.
      nodeResolve(),
      babel({ babelHelpers: 'bundled' }),
      commonjs()
    ]
  }
}
