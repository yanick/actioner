'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonSchemaShorthand = require('json-schema-shorthand');

var _jsonSchemaShorthand2 = _interopRequireDefault(_jsonSchemaShorthand);

var _updeep = require('updeep');

var _updeep2 = _interopRequireDefault(_updeep);

var _ajv = require('ajv');

var _ajv2 = _interopRequireDefault(_ajv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const as_type = name => name.replace(/([A-Z])/g, '_$1').toUpperCase();

let Actions = class Actions {

    constructor(args = {}) {
        this._schema_defs = {};
        this._is_validating = false;
        this._schema_id = 'http://localhost/actions';
        this._actions = {};
        this._definitions = {};
        this._type_to_action = {};

        if (args.schema_id) this._schema_id = args.schema_id;

        if (args.ajv) {
            this._ajv = args.ajv;
        }

        if (args.definitions) {
            this._definitions = args.definitions;
        }

        this._is_validating = false;
        if (args.validate !== undefined) {
            this._is_validating = args.validate;
        }

        this._schema_include = args.schema_include || {};
    }

    get schema_include() {
        return this._schema_include;
    }

    get schema() {
        return this._schema;
    }

    _update_schema() {
        this._schema = (0, _jsonSchemaShorthand2.default)({
            definitions: _lodash2.default.merge({}, this._definitions, this._schema_defs),
            "$id": this._schema_id,
            oneOf: (0, _lodash2.default)(this._schema_defs).keys().map(def => ({ '$ref': '#/definitions/' + def })).value()
        });

        if (this.ajv) {
            this.ajv.removeSchema(this._schema_id);
            this.ajv.addSchema(this._schema, this._schema_id);
        }
    }

    get is_validating() {
        return this._is_validating;
    }

    get types() {
        return _lodash2.default.keyBy(_lodash2.default.keys(this._actions).map(as_type));
    }

    get actions() {
        return this._actions;
    }

    get ajv() {
        if (!this._ajv) {
            this._ajv = new _ajv2.default();
        }
        return this._ajv;
    }

    validate(action) {
        if (!this._is_validating) return;

        let type = this._type_to_action[action.type];

        if (!type) throw new Error(`type ${action.type} not recognized`);

        if (this.ajv.validate({
            '$ref': this._schema_id + '#/definitions/' + type
        }, action)) return;

        let error = this._ajv.errors;
        error.action = action;
        throw error;
    }

    add(name, ...args) {
        let func = args.length && typeof args[0] === 'function' ? args.shift() : x => x || {};

        let schema = args.shift();

        let token = as_type(name);

        this._type_to_action[token] = name;

        let steps = [func, (0, _updeep2.default)({ type: token })];

        if (this._is_validating) {
            steps.push(action => {
                if (!this.ajv.validate({
                    '$ref': this._schema_id + '#/definitions/' + name
                }, action)) {
                    let error = this._ajv.errors;
                    error.action = action;
                    throw error;
                }
                return action;
            });
        }

        this._actions[name] = _lodash2.default.flow(steps);

        schema = _lodash2.default.merge({}, (0, _jsonSchemaShorthand2.default)(schema), (0, _jsonSchemaShorthand2.default)(this._schema_include), { type: 'object' });

        schema = (0, _updeep2.default)({ properties: { type: { enum: [token] } } })(schema);

        this._schema_defs = (0, _updeep2.default)({ [name]: schema })(this._schema_defs);

        this._update_schema();

        return this;
    }

};
exports.default = Actions;