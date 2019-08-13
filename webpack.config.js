module.exports = {
  output: {
    filename: 'subtile3d.js',
    libraryTarget: 'var',
    library: 'subtile3d'
  },
  mode: 'development',
  context: __dirname,
  entry: './src/3d.js',
  devtool: 'inline-source-map', 
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
  }
}
