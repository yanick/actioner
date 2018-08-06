
import Actioner from './index';

import { object, string, array } from 'json-schema-shorthand';

test( 'basic use', () => {
    let Actions = new Actioner();
    Actions._add( 'foo' );

    expect( Actions.FOO ).toBe('FOO');
    expect( Actions.foo() ).toMatchObject( { type: 'FOO' });

});

test( 'camel and snake cases', () => {
    let Actions = new Actioner();
    Actions._add( 'foo_bar' );
    Actions._add( 'quxBar' );

    expect( Actions.foo_bar() ).toMatchObject({ type: 'FOO_BAR' }); // snake case
    expect( Actions.quxBar() ).toMatchObject({ type: 'QUX_BAR' }); // "camel case"
});

test( 'generator', () => {
    let Actions = new Actioner();
    Actions._add( 'foo', x => ( { bar: x } ) );

    expect( Actions.foo('baz') ).toMatchObject({ type: 'FOO', bar: 'baz' });
});

test( 'validation + schema', () => {
    let Actions = new Actioner();
    Actions._add( 'add_ship', { 
        properties: {
            ship_id: { type: 'string', required: true },
            hull:    { type: 'number', required: true },
        },
        additional_properties: false,
    });

    expect( Actions.add_ship()).toMatchObject({ type: 'ADD_SHIP' });
    //, "no validation by default" );

    expect( Actions.schema ).toMatchObject({ id: 'http://localhost/actions' }); 
    //, '_schema' );

    Actions._validate(true);

    expect( () => {
        Actions.add_ship();
        tap.fail( "add_ship should throw" );
    } ).toThrow();

    // doesn't throw
    Actions.add_ship({ ship_id: 'enkidu', hull: 9 });

    let schema = Actions.schema;

    expect( schema.definitions.add_ship ).toMatchObject({ type: 'object' } );
});

test( 'constructor', () => {
    let actions = new Actioner({ validate: true, schema_id: "stuff" });

    expect( actions._is_validating ).toBe(true);
    expect(actions._schema_id ).toBe('stuff' );
});

test( 'validation', () => {
    let actions = new Actioner({
        validate: true, 
        schema_id: "stuff" 
    });

    actions._add( 'foo', { properties: { bar: 'string' } } );
    actions._add( 'baz', { properties: { bar: 'string' } } );

    actions.foo({ bar: 'hello' });

    expect( () => actions.foo({ bar: [] }) ).toThrow();

});

test( 'raw generators', () => {
    let actions = new Actioner();

    actions._add( 'foo', x => ( { stuff:x } ) );

    expect( actions.foo( 'blah' ) ).toMatchObject({
        type: 'FOO',
        stuff: 'blah' 
    }); //, 'regular generator' );

    expect( actions.$foo( { 'thing': 'bleh' }) ).toMatchObject({
        type: 'FOO',
        thing: 'bleh' 
    });//, 'raw generator' );

});

 // use u.freeze for immutability
 // add options for the actions 
 // make avj configurable

test( 'immutable', () => {
    let actions = new Actioner();

    actions._add( 'foo' );

    let foo = actions.foo({ bar:  1 });
    foo.baz = 2;

    expect(foo).toMatchObject({ type: 'FOO', bar: 1, baz: 2 });
    //, 'mutable' );

    actions = new Actioner({ immutable: true });

    actions._add( 'foo' );

    foo = actions.foo({ bar:  1 });
    expect( () => foo.baz = 2 ).toThrow();

    expect( foo.asMutable() ).toMatchObject({ type: 'FOO', bar: 1 });
    //, 'immutable' );

});

test( 'dispatch', () => {
    let dispatched = [];
    let store = {
        dispatch: a => dispatched.push(a)
    };

    let actions = new Actioner({ store: store });

    actions._add( 'foo' );

    actions._add( 'bar', (x,y) => (  { x, y } ) );
    
    actions.dispatch_foo({ bar: 1 });

    expect( dispatched.shift() ).toMatchObject({ type: 'FOO', bar: 1 });

    actions.dispatch_$foo({ bar: 2 });

    expect( dispatched.shift() ).toMatchObject({ type: 'FOO', bar: 2 } );

    actions.dispatch_bar(1,2);

    expect( dispatched.shift() ).toMatchObject({ type: 'BAR', x: 1, y: 2 } );

    actions.dispatch_$bar({ x: 3, y: 4 });

    expect( dispatched.shift() ).toMatchObject( { type: 'BAR', x: 3, y: 4 } );

});

test( '_store function', () => {
    let dispatched = [];
    let store = {
        dispatch: a => dispatched.push(a)
    };

    let actions = new Actioner();
    actions._store = store;

    actions._add( 'foo' );
    
    actions.dispatch_foo({ bar: 1 });

    expect( dispatched.shift() ).toMatchObject({ type: 'FOO', bar: 1 } );

    actions.dispatch_$foo({ bar: 2 });

    expect( dispatched.shift() ).toMatchObject({ type: 'FOO', bar: 2 } );

});

test( 'schema_include', () => {
    let actions = new Actioner({
        schema_include: { properties: { alpha: 'number' } }
    });

    actions.$add( 'foo', { properties: { beta: 'string' } } );

    expect( actions.$schema.definitions.foo.properties ).toMatchObject(
        { alpha: {  type: 'number' }, beta: { type: 'string' },
            type: { enum: [ 'FOO' ] }
    }
    );


});

test( 'read-only attributes', () => {
    let actioner = new Actioner();

    actioner.$add( 'init_game', object({
        game: object({
            name: string(),
        }),
        objects: array(),
    }));

});

