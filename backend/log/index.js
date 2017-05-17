import log from 'loglevel';

// Please only use testLogger when testing
const testLogger = log.getLogger('test');
const generalLogger = log.getLogger('general');

// Each component of our app should have it's own logger
const apiLogger = log.getLogger('api');

if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-negated-condition
    testLogger.setLevel(log.levels.TRACE);
    generalLogger.setLevel(log.levels.TRACE);
    apiLogger.setLevel(log.levels.TRACE);
} else {
    testLogger.setLevel(log.levels.INFO);
    generalLogger.setLevel(log.levels.INFO);
    apiLogger.setLevel(log.levels.INFO);
}

export default generalLogger;

export {
    testLogger,
    generalLogger,
    apiLogger
};
