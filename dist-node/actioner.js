'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp, _initialiseProps;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonSchemaShorthand = require('json-schema-shorthand');

var _jsonSchemaShorthand2 = _interopRequireDefault(_jsonSchemaShorthand);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Ajv = void 0;
var Immutable = void 0;

var Actions = (_temp = _class = function () {
    function Actions() {
        var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Actions);

        _initialiseProps.call(this);

        if (args.schema_id) this._schema_id = args.schema_id;

        if (args.validate !== undefined) {
            this._validate(args.validate);
        }

        if (args.immutable) {
            this._immutable = args.immutable;
            Immutable = require('seamless-immutable');
        }

        if (args.store) {
            this.$store = args.store;
        }

        this.$schema_include = args.schema_include;
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
        key: '$validate',
        value: function $validate(v) {
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
        key: '$add',
        value: function $add(name) {
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

            schema = (0, _jsonSchemaShorthand2.default)(_lodash2.default.merge(schema, this.$schema_include, { type: 'object' }));

            if (!schema.properties) {
                schema.properties = {};
            }
            schema.properties['type'] = { enum: [token] };
            this._schema_defs[name] = schema;

            this._update_schema();
        }
    }, {
        key: '_store',
        get: function get() {
            return this.$store;
        },
        set: function set(s) {
            return this.$store = s;
        }
    }, {
        key: 'schema',
        get: function get() {
            return this.$schema;
        }
    }, {
        key: '_schema',
        get: function get() {
            return this.$schema;
        },
        set: function set(s) {
            return this.$schema = s;
        }
    }]);

    return Actions;
}(), _initialiseProps = function _initialiseProps() {
    var _this2 = this;

    this._schema_defs = {};
    this._is_validating = false;
    this._schema_id = 'http://localhost/actions';
    this.$schema = {};
    this._immutable = false;
    this.$store = undefined;
    this.$schema_include = null;

    this._validate = function (v) {
        return _this2.$validate(v);
    };

    this._add = function () {
        return _this2.$add.apply(_this2, arguments);
    };
}, _temp);
exports.default = Actions;