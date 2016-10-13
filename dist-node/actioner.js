'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonSchemaShorthand = require('json-schema-shorthand');

var _jsonSchemaShorthand2 = _interopRequireDefault(_jsonSchemaShorthand);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Ajv = void 0;
var Immutable = void 0;

var Actions = function () {
    function Actions() {
        var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Actions);

        this._schema_defs = {};
        this._is_validating = false;
        this._schema_id = 'http://localhost/actions';
        this._schema = {};
        this._immutable = false;
        this._store = undefined;

        if (args.schema_id) this._schema_id = args.schema_id;

        if (args.validate !== undefined) {
            this._validate(args.validate);
        }

        if (args.immutable) {
            this._immutable = args.immutable;
            Immutable = require('seamless-immutable');
        }

        if (args.store) {
            this._store = args.store;
        }
    }

    _createClass(Actions, [{
        key: '_update_schema',
        value: function _update_schema() {
            this._schema = (0, _jsonSchemaShorthand2.default)({
                definitions: this._schema_defs,
                id: this._schema_id,
                oneOf: (0, _lodash2.default)(this._schema_defs).keys().map(function (def) {
                    return { '$ref': '#/definitions/' + def };
                }).value()
            });

            if (this._ajv) {
                this._ajv.removeSchema(this._schema);
                this._ajv.addSchema(this._schema, this._schema_id);
            }
        }
    }, {
        key: '_validate',
        value: function _validate(v) {
            this._is_validating = v;

            // only require if needed
            if (this._is_validating) {
                if (!Ajv) Ajv = require('ajv');

                if (!this._ajv) {
                    this._ajv = new Ajv();
                    this._ajv.addSchema(this._schema, this._schema_id);
                }
            }
        }
    }, {
        key: '_add',
        value: function _add(name) {
            var _this = this;

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            var func = args.length && typeof args[0] === 'function' ? args.shift() : function (x) {
                return x || {};
            };

            var schema = args.shift();

            var token = name.replace(/([A-Z])/g, '_$1').toUpperCase();

            this[token] = token;

            this[name] = function () {
                var action = func.apply(undefined, arguments);
                action.type = token;

                if (_this._is_validating) {
                    if (!_this._ajv.validate({
                        '$ref': _this._schema_id + '#/definitions/' + name
                    }, action)) {
                        var error = _this._ajv.errors;
                        error.action = action;
                        throw error;
                    }
                }

                if (_this._immutable) action = Immutable(action);

                return action;
            };

            this['$' + name] = function (args) {
                var action = _lodash2.default.cloneDeep(args);
                action.type = token;

                if (_this._is_validating) {
                    if (!_this._ajv.validate({
                        '$ref': _this._schema_id + '#/definitions/' + name
                    }, action)) {
                        var error = _this._ajv.errors;
                        error.action = action;
                        throw error;
                    }
                }

                if (_this._immutable) action = Immutable(action);

                return action;
            };

            this['dispatch_' + name] = function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                _this._store.dispatch(_this[name].apply(null, args));
            };

            this['dispatch_$' + name] = function (args) {
                _this._store.dispatch(_this['$' + name](args));
            };

            schema = schema ? { object: schema } : {};

            schema = (0, _jsonSchemaShorthand2.default)(schema);

            if (!schema.properties) {
                schema.properties = {};
            }
            schema.properties['type'] = { enum: [token] };
            if (schema.additionalProperties === undefined) {
                schema.additionalProperties = false;
            }
            this._schema_defs[name] = schema;

            this._update_schema();
        }
    }, {
        key: 'schema',
        get: function get() {
            return this._schema;
        }
    }]);

    return Actions;
}();

exports.default = Actions;