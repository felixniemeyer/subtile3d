const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development', 
  watch: true,
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: 'raw-loader'
      }
    ]
  },
  resolve: {
    alias: {
      shader: './build-shaders.dev.js'
    }
  }
})
