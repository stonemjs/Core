import copy from 'rollup-plugin-copy'
import babel from '@rollup/plugin-babel'
import multi from '@rollup/plugin-multi-entry'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import nodeExternals from 'rollup-plugin-node-externals'

const inputs = {
  config: 'src/config/*.mjs',
  decorators: 'src/decorators/*.mjs',
  index: [
    'src/pipes/*.mjs',
    'src/events/*.mjs',
    'src/adapter/*.mjs',
    'src/ErrorHandler.mjs',
    'src/StoneFactory.mjs',
    'src/CoreServiceProvider.mjs',
    '!src/events/EventEmitter.mjs'
  ],
}

export default Object.entries(inputs).map(([name, input]) => ({
	input,
	output: [
    { format: 'es', file: `dist/${name}.js` }
  ],
  plugins: [
    multi(),
    nodePolyfills({ include: ['events'], sourceMap: true }),
    nodeExternals({
      include: [/^@stone-js\/core/]
    }), // Must always be before `nodeResolve()`.
    nodeResolve({
      exportConditions: ['node', 'import', 'require', 'default']
    }),
    babel({ babelHelpers: 'bundled' }),
    commonjs(),
    copy({
      targets: [
        { src: 'src/config/options.mjs', dest: 'dist' }
      ]
    })
  ]
}))