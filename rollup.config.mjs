import json from '@rollup/plugin-json'
import del from 'rollup-plugin-delete'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import nodeExternals from 'rollup-plugin-node-externals'

const isProduction = ['production', 'prod'].includes(process.env.NODE_ENV ?? 'prod')

export default {
	input: 'src/index.mjs',
	output: {
		format: 'umd',
    name: 'StoneHttp',
		file: 'dist/index.js',
    plugins: isProduction ? [terser()] : [],
    sourcemap: isProduction ? false : 'inline'
	},
  plugins: [
    json(),
    nodePolyfills({ include: ['events'], sourceMap: !isProduction }),
    nodeExternals({ deps: false }), // Must always be before `nodeResolve()`.
    nodeResolve(),
    babel({ babelHelpers: 'bundled' }),
    commonjs(),
    del({ targets: 'dist/*', runOnce: true }),
  ]
};