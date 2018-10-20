import _ from 'lodash';

import Actioner from './index';

let actioner = new Actioner();
actioner.add('do_stuff', () => ({ foo: true }) );

_.merge(module.exports, _.keyBy(actioner.types), actioner.actions );

export default actioner;
