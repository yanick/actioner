'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _jsonSchemaShorthand = require('json-schema-shorthand');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

test('basic use', () => {
    let Actions = new _index2.default();
    Actions.add('foo').add('bar');

    expect(Actions.types).toMatchObject(['BAR', 'FOO']);
    expect(Actions.actions.foo()).toMatchObject({ type: 'FOO' });
});

test('camel and snake cases', () => {
    let Actions = new _index2.default();
    Actions.add('foo_bar');
    Actions.add('quxBar');

    expect(Actions.types).toMatchObject(['FOO_BAR', 'QUX_BAR']);

    expect(Actions.actions.foo_bar()).toMatchObject({ type: 'FOO_BAR' }); // snake case
    expect(Actions.actions.quxBar()).toMatchObject({ type: 'QUX_BAR' }); // "camel case"
});

test('generator', () => {
    let Actions = new _index2.default();
    Actions.add('foo', x => ({ bar: x }));

    expect(Actions.actions.foo('baz')).toMatchObject({ type: 'FOO', bar: 'baz' });
});

test('validation + schema', () => {
    let Actions = new _index2.default({ validate: true });

    expect(Actions.ajv).toBeInstanceOf(require('ajv'));

    Actions.add('add_ship', {
        properties: {
            ship_id: { type: 'string', required: true },
            hull: { type: 'number', required: true }
        },
        additional_properties: false
    });

    expect(Actions.schema).toMatchSnapshot();

    expect(() => Actions.actions.add_ship()).toThrow();

    // doesn't throw
    Actions.actions.add_ship({ ship_id: 'enkidu', hull: 9 });
});

test('constructor', () => {
    let actions = new _index2.default({ validate: true, schema_id: "stuff" });

    expect(actions.is_validating).toBe(true);
    expect(actions._schema_id).toBe('stuff');
});

test('validation', () => {
    // defaults 
    let actioner = new _index2.default();
    expect(actioner.is_validating).toBe(false);

    let actions = new _index2.default({
        validate: true,
        schema_id: "stuff"
    });

    actions.add('foo', { properties: { bar: 'string' } });
    actions.add('baz', { properties: { bar: 'string' } });

    let { foo } = actions.actions;

    foo({ bar: 'hello' });

    expect(() => foo({ bar: [] })).toThrow();
});

test('generators', () => {
    let actions = new _index2.default();

    actions.add('foo', x => ({ stuff: x }));

    expect(actions.actions.foo('blah')).toMatchObject({
        type: 'FOO',
        stuff: 'blah'
    }); //, 'regular generator' );
});

test('immutable', () => {
    let actions = new _index2.default();

    actions.add('foo');

    let foo = actions.actions.foo({ bar: 1 });

    expect(() => foo.baz = 2).toThrow();
});

test('schema_include', () => {
    let actions = new _index2.default({
        schema_include: { properties: { alpha: 'number' } }
    });

    actions.add('foo', { properties: { beta: 'string' } });

    expect(actions.$schema.definitions.foo.properties).toMatchObject({ alpha: { type: 'number' }, beta: { type: 'string' },
        type: { enum: ['FOO'] }
    });
});

test('read-only attributes', () => {
    let actioner = new _index2.default();

    actioner.add('init_game', (0, _jsonSchemaShorthand.object)({
        game: (0, _jsonSchemaShorthand.object)({ name: (0, _jsonSchemaShorthand.string)() }),
        objects: (0, _jsonSchemaShorthand.array)()
    }));
});

test('typical export', () => {
    let { DO_STUFF, do_stuff } = require('./test_helper');

    expect(DO_STUFF).toBe('DO_STUFF');
    expect(do_stuff()).toMatchObject({ type: DO_STUFF, foo: true });
});