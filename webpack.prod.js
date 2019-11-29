const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: './src/3rd-party/webpack-glsl-minify.js'
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
