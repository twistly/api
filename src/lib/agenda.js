import Agenda from 'agenda';
import d from 'debug';
import config from '../config';
import email from '../jobs/email';

const debug = d('twistly:lib:agenda');
const uri = process.env.MONGO_URL || config.get('database.url');
const agenda = new Agenda({db: {address: uri}});

agenda.on('ready', () => {
    debug('agenda ready');
    email(agenda);
});

export default agenda;
