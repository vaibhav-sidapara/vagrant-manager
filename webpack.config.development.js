var webpack = require('webpack');
var webpackTargetElectronRenderer = require('webpack-target-electron-renderer');

var config = {
  entry: [
    'webpack-hot-middleware/client?reload=true&path=http://localhost:9000/__webpack_hmr',
    './src/index',
  ],
  devtool: "eval",
  module: {
    loaders: [{
      test: /\.js?$/,
      loaders: ['babel'],
      exclude: /node_modules/
    }, {
      test: /\.scss$/,
      loaders: ['style', 'css', 'sass'],
    },
    /*{
      test: /\.jpg|\.png|\.svg$/,
      loaders: ['file-loader']
  },*/
    {
      test: /\.(woff|png|jpg|gif)$/,
      loader: 'url-loader?limit=100000'
    }
    ]
  },
  output: {
    path: __dirname + '/dist',
    publicPath: 'http://localhost:9000/dist/',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ]
};

config.target = webpackTargetElectronRenderer(config);

module.exports = config;
