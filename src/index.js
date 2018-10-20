import _ from 'lodash';
import shorthand from 'json-schema-shorthand';
import u  from 'updeep';
import Ajv from 'ajv';

const as_type = name => name.replace( /([A-Z])/g, '_$1' ).toUpperCase();

export default
class Actions {
    _schema_defs = {};

    _is_validating = false;

    _schema_id = 'http://localhost/actions';

    _actions = {};

    _definitions = {};

    _type_to_action = {};

    constructor(args={}) {
        if( args.schema_id ) this._schema_id = args.schema_id;

        if( args.ajv ) {
            this._ajv = args.ajv;
        }

        if( args.definitions ) {
            this._definitions = args.definitions;
        }

        this._is_validating = false;
        if( args.validate !== undefined ) {
            this._is_validating = args.validate;
        }

        this._schema_include = args.schema_include || {};

    }

    get schema_include() { return this._schema_include }

    get schema()   { return this._schema }

    _update_schema() {
        this._schema = shorthand({
            definitions: _.merge( {}, this._definitions, this._schema_defs ),
            "$id": this._schema_id,
            oneOf: 
                _(this._schema_defs).keys().map(
                    def => ({ '$ref': '#/definitions/' + def })
                ).value()
        });

        if ( this.ajv ) {
            this.ajv.removeSchema( this._schema_id );
            this.ajv.addSchema( this._schema, this._schema_id );
        }
    }

    get is_validating() { return this._is_validating }

    get types() {
        return _.keyBy( _.keys( this._actions ).map(
            as_type
        ));
    }

    get actions() {
        return this._actions;
    }

    get ajv() { 
        if(!this._ajv) {
            this._ajv = new Ajv();
        }
        return this._ajv 
    }

    validate(action) {
        if ( !this._is_validating ) return;

        let type = this._type_to_action[action.type];

        if(!type) throw new Error( `type ${action.type} not recognized` );

        if ( this.ajv.validate({
                '$ref': this._schema_id + '#/definitions/' + type
            }, action )
        ) return;
        
        let error = this._ajv.errors;
        error.action = action;
        throw error;
    }

    add( name, ...args ) {
        let func = args.length && typeof args[0] === 'function' 
                            ? args.shift() 
                            : x => x || {};

        let schema = args.shift();

        let token = as_type(name);

        this._type_to_action[ token ] = name;

        let steps = [
            func,
            u({ type: token }),
        ];

        if ( this._is_validating ) {
            steps.push( action => {
                if ( ! this.ajv.validate({
                        '$ref': this._schema_id + '#/definitions/' + name
                    }, action )
                ){
                    let error = this._ajv.errors;
                    error.action = action;
                    throw error;
                }
                return action;
            })
        }

        this._actions[name] = _.flow(steps);

        schema = _.merge( {}, shorthand(schema), 
            shorthand(this._schema_include), 
            { type: 'object' },
        ); 

        schema = u({ properties: { type: { enum: [ token ] } } })(schema);

        this._schema_defs = u({ [name]: schema })(this._schema_defs);

        this._update_schema();

        return this;
    }

}
