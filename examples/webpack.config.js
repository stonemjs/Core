const path = require('path')
const Dotenv = require('dotenv-webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = {
  target: 'node',
  mode: 'development',
  entry: {
    http: path.resolve(__dirname, './src/http/index.mjs'),
    simple: path.resolve(__dirname, './src/simple/index.mjs'),
  },
  devtool: 'inline-source-map',
  plugins: [
    new Dotenv(),
    new CleanWebpackPlugin(),
    new NodePolyfillPlugin({ includeAliases: ['http', 'https'] }),
  ],
  output: {
    libraryTarget: 'umd',
    filename: '[name].core.example.js',
    globalObject: 'this',
    library: '[name]CoreExample',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.m?js$/,
        use: 'webpack-import-glob'
      },
    ]
  }
}
