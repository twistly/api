import Agenda from 'agenda';
import d from 'debug';
import config from '../config';
import jobs from '../jobs';
import {Queue} from '../models';
import {createQueueJob} from '../utils';

const ONE_MINUTE = 60;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const debug = d('twistly:lib:agenda');
const uri = process.env.MONGO_URL || config.get('database.url');
debug(uri);
const agenda = new Agenda({db: {address: uri}});

agenda.on('ready', async () => {
    Object.keys(jobs).forEach(job => jobs[job](agenda));

    if (process.env.JOB_TYPES) {
        const jobTypes = process.env.JOB_TYPES.split(', ');

        if (jobTypes.includes('queue')) {
            debug('Creating "check queue" jobs');
            const queues = await Queue.find().select('_id interval owner').populate('owner').lean().exec();

            for (const queue of queues) {
                debug('Creating "check queue" job for queue [%s]', queue._id);
                const interval = ONE_DAY / queue.interval;

                createQueueJob({queueId: queue._id, userId: queue.owner._id, interval}).then(job => {
                    const {_id, data} = job.attrs;
                    const owner = data.userId;
                    debug(`Job [%s] for [%s] saved successfully`, _id, owner);
                });
            }
        }
    }
});

export default agenda;
