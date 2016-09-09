import _ from 'lodash';
import shorthand from 'json-schema-shorthand';

export default
class Actions {
    schema_defs = {};

    _add( name, func, schema ) {
        let token = name.toUpperCase();

        if ( !func ) { func = x => x || {} }

        this[token] = token;
        this[name] = (...args) => {
            let action = func.apply(null,args);
            action.type = token;
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
        this.schema_defs[name] = schema;
    }

    get schema() {
        let schema = {
            definitions: this.schema_defs,
            id: 'http://aotds.babyl.ca/actions',
            oneOf: 
                _(this.schema_defs).keys().map(
                    def => ({ '$ref': '#/definitions/' + def })
                ).value()
        };

        return shorthand(schema);
    }
}
