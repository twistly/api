import Agenda from 'agenda';

import {generalLogger as log} from '../api/log';

import setupBlogs from './setup-blogs';
import stats from './stats';

const agenda = new Agenda({
    db: {
        address: 'mongodb://127.0.0.1/twistly'
    }
});

agenda.define('stats', {
    priority: 'high',
    concurrency: 10
}, stats);

agenda.on('ready', () => {
    setupBlogs(agenda).then(() => {
        log.info('Starting agenda.');
        agenda.start();
    }).catch(error => log.warn(error));
});
