import Agenda from 'agenda';
import config from '../config';
import email from '../jobs/email';

const uri = process.env.MONGO_URL || config.get('database.url');
const agenda = new Agenda({db: {address: uri}});

email(agenda);

export default agenda;
