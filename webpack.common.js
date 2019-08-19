module.exports = {
  entry: './src/subtile3d.js',
  output: {
    filename: 'subtile3d.js',
    libraryTarget: 'var',
    library: 'subtile3d'
  },
  context: __dirname,
  module: {
    rules: [
      {
        test: /\.frag$/,
        use: 'raw-loader'
      },
      {
        test: /\.vert$/,
        use: 'raw-loader'
      }
    ]
  },
  resolve: {
    alias: {
      shader: './build-shaders.dev.js'
    }
  }
}
