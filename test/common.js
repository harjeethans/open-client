'use strict';

global.chai = require('chai');
global.chai.should();

global.expect = global.chai.expect;
global.sinon = require('sinon');

global.sinonChai = require('sinon-chai');
global.chai.use(global.sinonChai);

require('babel-polyfill');
require('babel-register')({
  ignore: /node_modules/,
  cache: true
});