
import Actioner from './index';

import { object, string, array } from 'json-schema-shorthand';

test( 'basic use', () => {
    let Actions = new Actioner();
    Actions.add( 'foo' ).add( 'bar' );

    expect( Actions.types ).toMatchObject([ 'BAR', 'FOO' ]);
    expect( Actions.actions.foo() ).toMatchObject( { type: 'FOO' });

});

test( 'camel and snake cases', () => {
    let Actions = new Actioner();
    Actions.add( 'foo_bar' );
    Actions.add( 'quxBar' );

    expect( Actions.types ).toMatchObject( [ 'FOO_BAR', 'QUX_BAR' ] );

    expect( Actions.actions.foo_bar() ).toMatchObject({ type: 'FOO_BAR' }); // snake case
    expect( Actions.actions.quxBar() ).toMatchObject({ type: 'QUX_BAR' }); // "camel case"
});

test( 'generator', () => {
    let Actions = new Actioner();
    Actions.add( 'foo', x => ( { bar: x } ) );

    expect( Actions.actions.foo('baz') ).toMatchObject({ type: 'FOO', bar: 'baz' });
});

test( 'validation + schema', () => {
    let Actions = new Actioner({ validate: true });

    expect(Actions.ajv).toBeInstanceOf( require('ajv') );

    Actions.add( 'add_ship', { 
        properties: {
            ship_id: { type: 'string', required: true },
            hull:    { type: 'number', required: true },
        },
        additional_properties: false,
    });

    expect(Actions.schema).toMatchSnapshot();

    expect( () => Actions.actions.add_ship() ).toThrow();

    // doesn't throw
    Actions.actions.add_ship({ ship_id: 'enkidu', hull: 9 });
});

test( 'constructor', () => {
    let actions = new Actioner({ validate: true, schema_id: "stuff" });

    expect( actions.is_validating ).toBe(true);
    expect(actions._schema_id ).toBe('stuff' );
});

test( 'validation', () => {
    // defaults 
    let actioner = new Actioner();
    expect(actioner.is_validating).toBe(false);

    let actions = new Actioner({
        validate: true, 
        schema_id: "stuff" 
    });

    actions.add( 'foo', { properties: { bar: 'string' } } );
    actions.add( 'baz', { properties: { bar: 'string' } } );

    let { foo } = actions.actions;

    foo({ bar: 'hello' });

    expect( () => foo({ bar: [] }) ).toThrow();

});

test( 'generators', () => {
    let actions = new Actioner();

    actions.add( 'foo', x => ( { stuff:x } ) );

    expect( actions.actions.foo( 'blah' ) ).toMatchObject({
        type: 'FOO',
        stuff: 'blah' 
    }); //, 'regular generator' );
});

test( 'immutable', () => {
    let actions = new Actioner();

    actions.add( 'foo' );

    let foo = actions.actions.foo({ bar:  1 });

    expect( () => foo.baz = 2 ).toThrow();
});

test( 'schema_include', () => {
    let actions = new Actioner({
        schema_include: { properties: { alpha: 'number' } }
    });

    actions.add( 'foo', { properties: { beta: 'string' } } );

    expect( actions.schema.definitions.foo.properties ).toMatchObject(
        { alpha: {  type: 'number' }, beta: { type: 'string' },
            type: { enum: [ 'FOO' ] }
    }
    );


});

test( 'read-only attributes', () => {
    let actioner = new Actioner();

    actioner.add( 'init_game', object({
        game: object({ name: string() }),
        objects: array(),
    }));

});

test( 'typical export', () => {
    let { DO_STUFF, do_stuff } = require( './test_helper' );

    expect(DO_STUFF).toBe('DO_STUFF');
    expect(do_stuff()).toMatchObject({ type: DO_STUFF, foo: true });
});

test( 'shorthands are expanded', () => {
    const actioner = new Actioner();
    actioner.add( 'do_stuff', { 
        type: 'object',
        properties: {
            thing: 'string!'
        }
    });

    expect(actioner.schema).toMatchObject({
        definitions: { 
            do_stuff: {
                type: 'object',
                required: [ 'thing' ],
                properties: { thing: { type: 'string' } },
            }
        }
    });
});

test( 'includes', () => {
    let actioner = new Actioner({
        schema_include: {
            properties: {
                included: { type: "boolean" }
            }
        }
    });

    actioner.add( 'foo', object({
        bar: 'number'
    }) );

    expect(actioner.schema).toHaveProperty(
        'definitions.foo.properties.included'
    );
    
});

test.only( 'definitions', () => {
    let actioner = new Actioner({
        validate: true,
        definitions: {
            included: {
                type: 'boolean',
            },
        },
        schema_include: {
            properties: {
                included: '#/definitions/included'
            }
        }
    });

    actioner.add( 'foo', object({
        bar: 'number'
    }) );

    expect(actioner.schema).toHaveProperty(
        'definitions.foo.properties.included.$ref'
    );

    expect( () =>
        actioner.validate( 'foo', { type: 'FOO', included: "potato" } )
    ).toThrow();

    expect( () =>
        actioner.validate( 'foo', { type: 'FOO', included: true } )
    ).not.toThrow();
    
});
