import mongoose from 'mongoose';

import {version} from '../../package';
import app from './main';
import config from './config';
import log from './log';

const port = process.env.PORT || config.get('app.port');
const db = process.env.MONGO_URL || config.get('database.url');

if (config.get('database.enabled')) {
    mongoose.connect(db).then(() => {
        log.info(`Connected to ${db}`);
    }).catch(err => {
        log.error(err);
        process.exit(1);
    });
} else {
    log.info('Starting without database');
}

app.listen(port, () => {
    log.info(`Twistly's API ${version} is running on port ${port}.`);
});
