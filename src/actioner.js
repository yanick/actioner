import _ from 'lodash';
import shorthand from 'json-schema-shorthand';

let Ajv;

export default
class Actions {
    _schema_defs = {};

    _is_validating = false;

    _schema_id = 'http://localhost/actions';

    _schema = {};

    constructor(args={}) {
        if( args.schema_id ) this._schema_id = args.schema_id;

        if( args.validate !== undefined ) {
            this._validate(args.validate);
        }
    }

    get schema() { return this._schema }

    _update_schema() {
        this._schema = shorthand({
            definitions: this._schema_defs,
            id: this._schema_id,
            oneOf: 
                _(this._schema_defs).keys().map(
                    def => ({ '$ref': '#/definitions/' + def })
                ).value()
        });

        if ( this._ajv ) this._ajv.addSchema( this._schema, this._schema_id );
    }

    _validate(v) { 
        this._is_validating = v 

        // only require if needed
        if ( this._is_validating ) {
            if ( !Ajv ) Ajv = require('ajv');

            if ( ! this._ajv ) {
                this._ajv = new Ajv();
                this._ajv.addSchema( this._schema, this._schema_id );
            }
        }
    }

    _add( name, ...args ) {
        let func = 
            args.length && typeof args[0] === 'function' ? args.shift() : x => x || {};

        let schema = args.shift();

        let token = name.replace( /([A-Z])/g, '_$1' ).toUpperCase();

        this[token] = token;

        this[name] = (...args) => {
            let action = func(...args);
            action.type = token;

            if ( this._is_validating ) {
                if ( ! this._ajv.validate({
                    '$ref': this._schema_id + '#/definitions/' + name
                }, action )){
                    let error = this._ajv.errors;
                    error.action = action;
                    throw error;
                }

            }

            return action;
        };

        schema = schema ? { object: schema } : {};

        schema = shorthand(schema);

        if (! schema.properties ) {
            schema.properties = {}
        }
        schema.properties['type'] = { enum: [ token ] };
        if( schema.additionalProperties === undefined ) {
            schema.additionalProperties = false;
        }
        this._schema_defs[name] = schema;

        this._update_schema();

    }

}
