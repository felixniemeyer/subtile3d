const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: './src/dev-tools/webpack-glsl-minify.js'
      }
    ]
  },
  resolve: {
    extensions: [ '.glsl' ],
    alias: {
      shader: './build-shaders.prod.js'
    }
  }
})
