const path = require( 'path' );
module.exports = {
  mode: 'production',
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
};
