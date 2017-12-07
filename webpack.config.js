'use strict';

var webpack = require('webpack');
var path = require('path');

var options = {

  entry: './src/index',

  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
    publicPath: __dirname + '/dist'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src')
      }, {
        test: /\.scss?$/,
        loaders: ['style', 'css', 'sass'],
        include: __dirname,
        exclude: /node_modules\/[^font]/
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
  }
};

module.exports = options;
