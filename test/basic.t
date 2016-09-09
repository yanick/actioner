import tap from 'tap';

import Actioner from 'actioner';

tap.test( 'basic use', tap => {
    let Actions = new Actioner();
    Actions._add( 'foo' );

    tap.is( Actions.FOO, 'FOO', "action type" );
    tap.same( Actions.foo(), { type: 'FOO' }, "action generator" );

    tap.end();
});

tap.end();
