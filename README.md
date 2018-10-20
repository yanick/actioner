# Actioner

Actioner is a little utility to help define, manage and validate 
Redux actions.

## To install

    npm install actioner

## Usage

The simple case:

    import Actioner from 'actioner';

    let actioner = new Actioner();

    actioner.add( 'move_ship' );
    actioner.add( 'add_ship' );

    console.log( actioner.types.MOVE_SHIP ); // prints 'MOVE_SHIP'

    let action = actioner.actions.add_ship( { id: 'enkidu', hull: 9 } );
    // action === { type: 'MOVE_SHIP', id: 'enkidu', hull: 9 }


Definining custom generating functions:

    actioner.add( 'move_ship', ship => ({
        ( typeof ship === 'object' ) ? ship.id : ship
    }) );

    let action = actioner.actions.move_ship( 'enkidu' );
    // action === { type: 'MOVE_SHIP', ship_id: 'enkidu' }

With json-schema validation:

    new actioner = new Actioner({ 
        validate: true,
        schema_id: 'http://example.com/actions' 
    });

    actioner.actions.add( 'add_ship', {
        properties: {
            ship_id: { type: 'string', required: true },
            hull:    { type: 'number', required: true },
        },
        additional_properties: false,
    });

    actioner.actions.add_ship({ ship_id: 'enkidu' }); // will throw 

    let schema = Actions.schema();
    // schema === { 
    //     id: 'http://localhost/actions',
    //     oneOf: [ { '$ref': '#/definitions/add_ship' } ] 
    //     definitions: { 
    //         add_ship: {
    //             type: 'object', 
    //             properties: {
    //                 type:    { enum: [ 'ADD_SHIP' ] },
    //                 ship_id: { type: 'string' },
    //                 hull:    { type: 'number' },
    //             },
    //             additional_properties: false,
    //             required: [ 'ship_id', 'hull' ],
    //         }
    //     }


Note that the actions returned by the generators are 
automatically made immutable via `updeep`, unless the 
node environment is set to `production`.

Typically, I create an actioner in its own file and export the types 
and action generators with something that looks like this:

    import _ from 'lodash';

    import Actioner from './actioner';

    let actioner = new Actioner();

    actioner.add('do_stuff', () => { ... } );

    _.merge(module.exports, actioner.mapped_types, actioner.actions );

    export default actioner;

## Class Actioner

### new Actioner({ schema_id: url, validate: boolean })

    let MyActions = new Actioner({
        schema_id:      'http://myapp.redux/actions',
        validate:       true,
        schema_include: { additional_properties: false },
        ajv:            ajv
    });

Creates a new actioner action object. If `schema_id` is not provided, it 
defaults to `http://localhost/actions`. 

If `validate` is `true`, then
actions will be validated when created (defaults to `false`).

If provided, `schema_include` will be merged in to all
action schema. Useful to clamp down on additional properties, as the example
shows, or to add properties shared by all actions. Defaults to an empty
object.

The `ajv` object used for the validations can be provided. If not,
it will be created by the actioner object.

### add( name, generating_function, schema )

    actioner.add( 'do_stuff' );

    actioner.add( 'do_other_stuff, stuff => ( { task: stuff } ) )

    actioner.add( 'do_sumfin_else, { properties: { task: 'object' } } )

Adds a new action. The `name` is the only mandatory argument, and must be in
its lowercase format (camel-case and snake-case, `do_stuff` and `doStuff`, are
both accepted. Once the action is added, its type and generating function 
are both available via the `types` and `actions` methods of 
the Actioner object.

    // snake-case
    actioner.add( 'do_stuff' );

    actioner.types.DO_STUFF;  // === 'DO_STUFF'

    actioner.actions.do_stuff({ thing: 'wash potatoes' });  
    // === { type: 'DO_STUFF', thing: 'wash potatoes' }

    // camel-case
    actioner.add( 'doThing' );

    actioner.types.DO_THING;  // === 'DO_THING'

    actioner.actions.doThing({ stuff: 'wash potatoes' });
    // === { type: 'DO_THING', stuff: 'wash potatoes' }

By default, the creator function takes its input object and adds the
`type` attribute to it. A function can be given to `add` to custom the
generation. The function is expected to return an object (to which the `type`
will still be added.

    actioner.add( 'do_stuff', thing => { must_do: thing } );

    actioner.actoins.do_stuff( 'wash potatoes' );
    // === { type: 'DO_STUFF', must_do: 'wash potatoes' }

A schema can also be given, which will be used to validate actions upon
creation if validation is enabled. The schema is expanded by
[json-schema-shorthand](https://github.com/yanick/json-schema-shorthand).

Returns the actioner object.


### is_validating

Boolean flag indicating if the actioner object is validating 
the actions when generated.

### ajv 

Returns the ajv object used for the validations (if validation is enabled).

### schema

Returns the json schema describing the set of registered 
actions (assuming, of course, that  schema definitions have been
provided to `add()`).


### schema_include 

Returns the value of `schema_include` passed to the constructor.

### types 

Returns an array with all the action types, sorted alphabetically. 

### mapped_types 

Returns an object with all the action types. Purely a helper function to 
make the export of the types easier.

### actions 

Returns an object with the action names and their generator functions.


