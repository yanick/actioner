# Actioner

Actioner is a little utility to help define, manage and validate 
Redux actions.

## To install

    npm install actioner

## Usage

The simple case:

    import Actioner from 'actioner';

    let Actions = new Actioner();

    Actions.$add( 'move_ship' );
    Actions.$add( 'add_ship' );

    console.log( Actions.MOVE_SHIP ); // prints 'MOVE_SHIP'

    let action = Actions.add_ship( { id: 'enkidu', hull: 9 } );
    // action === { type: 'MOVE_SHIP', id: 'enkidu', hull: 9 }


Definining custom generating functions:

    Actions.$add( 'move_ship', ship => ({
        ( typeof ship === 'object' ) ? ship.id : ship
    }) );

    let action = Actions.move_ship( 'enkidu' );
    // action === { type: 'MOVE_SHIP', ship_id: 'enkidu' }

With json-schema validation:

    new Actions = new Actioner({ schema_id: 'http://example.com/actions' });

    Actions.$add( 'add_ship', {
        properties: {
            ship_id: { type: 'string', required: true },
            hull:    { type: 'number', required: true },
        },
        additional_properties: false,
    });

    Actions.$validate(true);

    Actions.add_ship({ ship_id: 'enkidu' }); // will throw 

    let schema = Actions.$schema();
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


## Class Actioner

### new Actioner({ schema_id: url, validate: boolean })

    let MyActions = new Actioner({
        schema_id:      'http://myapp.redux/actions',
        validate:       true,
        immutable:      false,
        store:          my_store,
        schema_include: { additional_properties: false }
    });

Creates a new actioner action object. If `schema_id` is not provided, it 
defaults to `http://localhost/actions`. `validate` is also optional, and
defaults to `false`. 

If `immutable` is set to true, the generated
actions will be set as immutable objects via
[seamless-immutable](https://github.com/rtfeldman/seamless-immutable).
Defaults to `false`

`store` is an optional store object, that will be used
for the `dispatch_*` functions.

If provided, `schema_include` will be merged in to all
action schema. 

### $add( name, generating_function, schema )

    MyActions.$add( 'do_stuff' );

    MyActions.$add( 'do_other_stuff, stuff => ( { thingy: stuff } ) )

    MyActions.$add( 'do_sumfin_else, { properties: { thingy: 'object' } } )

Adds a new action. The `name` is the only mandatory argument, and must be in
its lowercase format (camel-case and snake-case, `do_stuff` and `doStuff`, are
both accepted. Once the action is added, the Actioner object will be given
five new properties: 

* the upper-cased action name (`DO_STUFF`) will returns its string
representation,

* the lower-case action name (`do_stuff`) will be the action creator,

* the lower-case action name prepended with `$` (`$do_stuff`)
will be the default action creator that always takes
in a raw object (and only add the `type` to it).

* a `dispatch_*` function (`dispatch_do_stuff`) that will
create the action and dispatch it to the store.

* a `dispatch_$*` function (`dispatch_$do_stuff`) that will
create the action via the raw creator and dispatch it to the store.

    // snake-case
    MyActions.$add( 'do_stuff' );

    MyActions.DO_STUFF;  // === 'DO_STUFF'

    MyActions.do_stuff({ thing: 'wash potatoes' });  
    // === { type: 'DO_STUFF', thing: 'wash potatoes' }

    // camel-case
    MyActions.$add( 'doThing' );

    MyActions.DO_THING;  // === 'DO_THING'

    MyActions.doThing({ stuff: 'wash potatoes' });
    // === { type: 'DO_THING', stuff: 'wash potatoes' }

By default, the creator function simply takes its input object and adds the
`type` attribute to it. A function can be given to `_add` to custom the
generation. The function is expected to return an object (to which the `type`
will still be added.

    MyActions.$add( 'do_stuff', thing => { must_do: thing } );

    MyActions.do_stuff( 'wash potatoes' );
    // === { type: 'DO_STUFF', must_do: 'wash potatoes' }

    // to pass a raw object, use the '$' creator
    MyActions.$do_stuff({ must_do: 'wash potatoes' });
    // === { type: 'DO_STUFF', must_do: 'wash potatoes' }

A schema can also be given, which will be used to validate actions upon
creation if validation is enabled. The schema is expanded by
[json-schema-shorthand](https://github.com/yanick/json-schema-shorthand).

The `$add` method was previously named `_add` (which is now deprecated).

### $validate(boolean)

Turns validation `on` or `off`. Validation is done via 
[avj](https://github.com/epoberezkin/ajv).

The `$validate` method was previously named `_validate` (which is now deprecated).

### $store

Sets a store object to be used by the `dispatch_*` functions.

    MyActions.$store = myReduxStore;

The `$store` method was previously named `_store` (which is now deprecated).

### $schema

Returns the json schema describing the set of registered 
actions (assuming, of course, that  schema definitions have been
provided to `$add()`).

The `$schema` method was previously named `_schema` (which is now deprecated).


### $schema_include

Accessors to the data to be merged with all action schemas.
Note that changing the `$schema_include` only reflect
on subsequently `$add`ed actions.