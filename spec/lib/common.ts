///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

var _global = <any>(window);
var beforeEach = _global.beforeEach;
var before = _global.before;
var describe = _global.describe;
var it = _global.it;
var sinon = _global.sinon;
var expect = _global.expect;

var angularMocks = {
  module: _global.module,
  inject: _global.inject,
};

export {
  beforeEach,
  before,
  describe,
  it,
  sinon,
  expect,
  angularMocks,
};
