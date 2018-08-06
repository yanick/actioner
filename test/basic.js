import tap from 'tap';

import Actioner from '../src/actioner';

import { object, string, array } from 'json-schema-shorthand';

tap.test( 'basic use', tap => {
    let Actions = new Actioner();
    Actions._add( 'foo' );

    tap.is( Actions.FOO, 'FOO', "action type" );
    tap.same( Actions.foo(), { type: 'FOO' }, "action generator" );

    tap.end();
});

tap.test( 'camel and snake cases', tap => {
    let Actions = new Actioner();
    Actions._add( 'foo_bar' );
    Actions._add( 'quxBar' );

    tap.same( Actions.foo_bar(), { type: 'FOO_BAR' }, "snake case" );
    tap.same( Actions.quxBar(),  { type: 'QUX_BAR' }, "camel case" );

    tap.end();
});

tap.test( 'generator', tap => {
    let Actions = new Actioner();
    Actions._add( 'foo', x => ( { bar: x } ) );

    tap.same( Actions.foo('baz'), { type: 'FOO', bar: 'baz' }, "basic" );

    tap.end();
});

tap.test( 'validation + schema', tap => {
    let Actions = new Actioner();
    Actions._add( 'add_ship', { 
        properties: {
            ship_id: { type: 'string', required: true },
            hull:    { type: 'number', required: true },
        },
        additional_properties: false,
    });

    tap.same( Actions.add_ship(), { type: 'ADD_SHIP' }, "no validation by default" );

    tap.match( Actions.schema, { id: 'http://localhost/actions' }, '_schema' );

    Actions._validate(true);

    try {
        Actions.add_ship();
        tap.fail( "add_ship should throw" );
    }
    catch(e) {
        tap.match( e[0], { 'keyword': 'required' } );
    }

    // doesn't throw
    Actions.add_ship({ ship_id: 'enkidu', hull: 9 });

    let schema = Actions.schema;

    tap.match( schema.definitions.add_ship, { type: 'object' } );

    tap.end();
});

tap.test( 'constructor', tap => {
    let actions = new Actioner({ validate: true, schema_id: "stuff" });

    tap.is( actions._is_validating, true );
    tap.is( actions._schema_id, 'stuff' );

    tap.end();
});

tap.test( 'validation', tap => {
    let actions = new Actioner({
        validate: true, 
        schema_id: "stuff" 
    });

    actions._add( 'foo', { properties: { bar: 'string' } } );
    actions._add( 'baz', { properties: { bar: 'string' } } );

    try {
        actions.foo({ bar: 'hello' });
        tap.pass( 'good action' );
    } catch(e) { 
        // do nothing
    }

    try {
        actions.foo({ bar: [] });
    } catch(e) { 
        tap.pass( 'bad action' );
    }

    tap.end();

});

tap.test( 'raw generators', tap => {
    let actions = new Actioner();

    actions._add( 'foo', x => ( { stuff:x } ) );

    tap.same( actions.foo( 'blah' ), {
        type: 'FOO',
        stuff: 'blah' 
    }, 'regular generator' );

    tap.same( actions.$foo( { 'thing': 'bleh' }), {
        type: 'FOO',
        thing: 'bleh' 
    }, 'raw generator' );

    tap.end();
});

// TODO change tap for jest
// use u.freeze for immutability
// add options for the actions 
// make avj configurable

tap.test( 'immutable', tap => {
    let actions = new Actioner();

    actions._add( 'foo' );

    let foo = actions.foo({ bar:  1 });
    foo.baz = 2;

    tap.same( foo, { type: 'FOO', bar: 1, baz: 2 }, 'mutable' );

    actions = new Actioner({ immutable: true });

    actions._add( 'foo' );

    foo = actions.foo({ bar:  1 });
    try {
        foo.baz = 2;
        tap.fail("can't assign to immutable");
    }
    catch(e) {
        tap.pass("can't assign to immutable");
    }

    tap.same( foo.asMutable(), { type: 'FOO', bar: 1 }, 'immutable' );

    tap.end();
});

tap.test( 'dispatch', tap => {
    let dispatched = [];
    let store = {
        dispatch: a => dispatched.push(a)
    };

    let actions = new Actioner({ store: store });

    actions._add( 'foo' );

    actions._add( 'bar', (x,y) => (  { x, y } ) );
    
    actions.dispatch_foo({ bar: 1 });

    tap.same( dispatched.shift(), { type: 'FOO', bar: 1 } );

    actions.dispatch_$foo({ bar: 2 });

    tap.same( dispatched.shift(), { type: 'FOO', bar: 2 } );

    actions.dispatch_bar(1,2);

    tap.same( dispatched.shift(), { type: 'BAR', x: 1, y: 2 } );

    actions.dispatch_$bar({ x: 3, y: 4 });

    tap.same( dispatched.shift(), { type: 'BAR', x: 3, y: 4 } );

    tap.test( '_store function', tap => {
        let actions = new Actioner();
        actions._store = store;

        actions._add( 'foo' );
        
        actions.dispatch_foo({ bar: 1 });

        tap.same( dispatched.shift(), { type: 'FOO', bar: 1 } );

        actions.dispatch_$foo({ bar: 2 });

        tap.same( dispatched.shift(), { type: 'FOO', bar: 2 } );

        tap.end();
    });

    tap.end();
});

tap.test( 'schema_include', tap => {
    let actions = new Actioner({
        schema_include: { properties: { alpha: 'number' } }
    });

    actions.$add( 'foo', { properties: { beta: 'string' } } );

    tap.same( actions.$schema.definitions.foo.properties,
        { alpha: {  type: 'number' }, beta: { type: 'string' },
            type: { enum: [ 'FOO' ] }
    }
    );


    tap.end();
});

tap.test( 'read-only attributes', tap => {
    let actioner = new Actioner();

    actioner.$add( 'init_game', object({
        game: object({
            name: string(),
        }),
        objects: array(),
    }));

    tap.end();
});

tap.end();
