import mongoose from 'mongoose';
import {version} from '../package';
import app from './main';
import config from './config';
import log from './log';
import {announce} from './utils';

const port = process.env.PORT || config.get('app.port');
const uri = process.env.MONGO_URL || config.get('database.url');

announce();

if (config.get('database.enabled')) {
    mongoose.Promise = global.Promise;
    mongoose.connect(uri, {
        keepAlive: true,
        reconnectTries: Number.MAX_VALUE,
        useMongoClient: true
    }).then(() => {
        log.info(`Connected to ${uri}`);
    }).catch(err => {
        throw err;
    });
} else {
    log.info('Starting without database');
}

app.listen(port, () => {
    log.info(`Twistly's API ${version} is running on port ${port}.`);
});
