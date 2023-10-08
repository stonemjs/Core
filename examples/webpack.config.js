const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    simple: path.resolve(__dirname, './src/simple.mjs'),
    configurations: path.resolve(__dirname, './src/configurations.mjs'),
  },
  devtool: 'inline-source-map',
  plugins: [
    new CleanWebpackPlugin(),
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
      }
    ]
  }
}
