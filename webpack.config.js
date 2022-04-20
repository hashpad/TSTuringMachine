const path = require( 'path' );
var mode = process.env.NODE_ENV || 'development';
module.exports = {
  devtool: (mode === 'development') ? 'inline-source-map' : false,
  mode: mode,

  module: {
      rules: [
          {
              test: /\.tsx?/,
              use: {
                loader: 'ts-loader'
              },
              exclude: /node_modules/,
          }
      ]
  },

  resolve: {
      extensions: [ '.ts', '.js' ],
  },

  entry: './src/runner.ts',

  output: {
      path: path.resolve( __dirname, 'dist' ),
      filename: 'main.js',
  },
  devServer: {
    port: 3000,
    historyApiFallback: {
      index: './index.html'
    }
  }
};
