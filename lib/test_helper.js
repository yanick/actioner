'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let actioner = new _index2.default();
actioner.add('do_stuff', () => ({ foo: true }));

_lodash2.default.merge(module.exports, _lodash2.default.keyBy(actioner.types), actioner.actions);

exports.default = actioner;