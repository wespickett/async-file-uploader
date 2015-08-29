var path = require('path');

var appRoot = 'src/';
var outputRoot = 'dist/';
var dataRoot = 'data/';

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.js',
  data: dataRoot + '**/*.json',
  html: appRoot + '**/*.html',
  style: 'styles/**/*.css',
  stylus: appRoot + '**/*.styl',
  css: appRoot + '**/*.css',
  output: outputRoot,
  sourceMapRelativePath: '../' + appRoot,
  doc:'./doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/'
};
