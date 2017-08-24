import Agenda from 'agenda';
import d from 'debug';
import config from '../config';
import jobs from '../jobs';
import {Queue} from '../models';

const ONE_MINUTE = 60;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const debug = d('twistly:lib:agenda');
const uri = process.env.MONGO_URL || config.get('database.url');
const agenda = new Agenda({db: {address: uri}});

agenda.on('ready', async () => {
    debug('agenda ready');

    Object.keys(jobs).forEach(job => jobs[job](agenda));

    if (process.env.JOB_TYPES.indexOf('queue') !== -1) {
        const queues = await Queue.find().select('_id internal owner').lean().exec();
        queues.forEach(queue => {
            const interval = ONE_DAY / queue.interval;

            agenda.every(`${interval} seconds`, 'check queue', {
                userId: queue.owner,
                queueId: queue._id
            });
        });
    }
});

export default agenda;
