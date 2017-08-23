import mongoose from 'mongoose';
import d from 'debug';
import {version} from '../package';
import {app, agenda} from './lib';
import config from './config';
import log from './log';

const debug = d('twistly:index');
const port = process.env.PORT || config.get('app.port');
const uri = process.env.MONGO_URL || config.get('database.url');
const startServer = () => {
    if (process.env.WORKER) {
        agenda.start();
    } else {
        app.listen(port, () => {
            log.info(`Twistly's API ${version} is running on port ${port}.`);
        });
    }
};

if (config.get('database.enabled')) {
    debug(`Trying to connect to ${uri}`);
    mongoose.Promise = global.Promise;
    mongoose.connect(uri, {
        keepAlive: true,
        reconnectTries: Number.MAX_VALUE,
        useMongoClient: true
    }).then(() => {
        debug(`Connected to ${uri}`);
        log.info('Mongoose connected.');
        startServer();
    }).catch(err => {
        throw err;
    });
} else {
    log.info('Starting without database');
    startServer();
}
