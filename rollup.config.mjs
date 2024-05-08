import json from '@rollup/plugin-json'
import babel from '@rollup/plugin-babel'
import multi from '@rollup/plugin-multi-entry'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import nodeExternals from 'rollup-plugin-node-externals'

const inputs = {
  config: 'src/config/*.mjs',
  decorators: 'src/decorators/*.mjs',
  cli: ['src/cli/App.mjs', 'src/cli/utils.mjs'],
  index: ['src/StoneFactory.mjs', 'src/Event.mjs', 'src/AbstractProvider.mjs', 'src/ErrorHandler.mjs'],
}

export default Object.entries(inputs).map(([name, input]) => ({
	input,
	output: [
    { format: 'es', file: `dist/${name}.js` }
  ],
  external: ['@babel/core', 'fs-extra/esm', /^@?rollup/, 'glob', 'chokidar'],
  plugins: [
    json(),
    multi(),
    nodePolyfills({ include: ['events'], sourceMap: true }),
    nodeExternals({ deps: false }), // Must always be before `nodeResolve()`.
    nodeResolve({
      exportConditions: ['node', 'import', 'require', 'default']
    }),
    babel({ babelHelpers: 'bundled' }),
    commonjs()
  ]
}))