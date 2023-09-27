const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = (env) => {
  return {
    mode: env.prod ? 'production' : 'development',
    entry: path.resolve(__dirname, './src/index.mjs'),
    devtool: env.dev && 'inline-source-map',
    plugins: [
      new CleanWebpackPlugin(),
      new NodePolyfillPlugin({
        includeAliases: ['events']
      })
    ],
    output: {
      libraryTarget: 'umd',
      filename: 'index.js',
      globalObject: 'this',
      library: 'StoneJSCore',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
      ]
    }
  }
}
