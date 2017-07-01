import bunyan from 'bunyan';

const {SILENT, INFO, TRACE} = bunyan;

// Please only use testLogger when testing
const testLogger = bunyan.createLogger({name: 'test'});
const generalLogger = bunyan.createLogger({name: 'general'});

// Each component of our app should have it's own logger
const apiLogger = bunyan.createLogger({name: 'api'});
const authenticationLogger = bunyan.createLogger({name: 'authentication'});
const middlewareLogger = bunyan.createLogger({name: 'middleware'});

// This is a special logger that only works for mongoose
const serializer = data => {
    const query = JSON.stringify(data.query);
    const options = JSON.stringify(data.options || {});

    return `db.${data.coll}.${data.method}(${query}, ${options});`;
};

const mongooseLogger = bunyan.createLogger({
    name: 'mongooseLogger',
    src: false,
    serializers: {
        dbQuery: serializer
    }
});

if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-negated-condition
    testLogger.level(TRACE);
    generalLogger.level(TRACE);
    apiLogger.level(TRACE);
    authenticationLogger.level(TRACE);
    middlewareLogger.level(TRACE);
    mongooseLogger.level(TRACE);
} else {
    testLogger.level(INFO);
    generalLogger.level(INFO);
    apiLogger.level(INFO);
    authenticationLogger.level(INFO);
    middlewareLogger.level(INFO);
    mongooseLogger.level(SILENT);
}

export default generalLogger;

export {
    testLogger,
    generalLogger,
    apiLogger,
    authenticationLogger,
    middlewareLogger,
    mongooseLogger
};
