import mongoose from 'mongoose';

import {generalLogger as log} from '../log';

const Database = opts => {
    // Allows passing a string or object
    opts = (typeof opts === 'string') ? {uri: opts} : opts;
    opts = opts || {};

    // Create the database connection
    mongoose.connect(opts.uri);

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', () => {
        log.debug('Mongoose default connection open to ' + opts.uri);
    });

    // If the connection throws an error
    mongoose.connection.on('error', error => {
        log.error('Mongoose default connection error: ' + error);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', () => {
        log.debug('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            log.debug('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });

    return mongoose;
};

export default Database;
