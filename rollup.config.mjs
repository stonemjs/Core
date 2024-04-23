import json from '@rollup/plugin-json'
import babel from '@rollup/plugin-babel'
import multi from '@rollup/plugin-multi-entry'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import nodeExternals from 'rollup-plugin-node-externals'

const inputs = {
  decorators: 'src/decorators/*.mjs',
  index: ['src/StoneFactory.mjs', 'src/Event.mjs'],
}

export default Object.entries(inputs).map(([name, input]) => ({
	input,
	output: [
    { format: 'es', file: `dist/${name}.mjs` },
    { format: 'cjs', file: `dist/${name}.cjs` }
  ],
  plugins: [
    json(),
    multi(),
    nodePolyfills({ include: ['events'], sourceMap: true }),
    nodeExternals({ deps: false }), // Must always be before `nodeResolve()`.
    nodeResolve(),
    babel({ babelHelpers: 'bundled' }),
    commonjs()
  ]
}))