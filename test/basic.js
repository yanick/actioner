import tap from 'tap';

import Actioner from 'actioner';

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
        ship_id: { type: 'string', required: true },
        hull:    { type: 'number', required: true },
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

tap.end();
