import MongodbMemoryServer from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/main';
import {User} from '../../src/models';

mongoose.Promise = Promise;

const mongoServer = new MongodbMemoryServer();

// Create connection to mongoose before all tests
const before = async () => {
    await mongoose.connect(await mongoServer.getConnectionString(), {useMongoClient: true});
};

// Create fixtures before each test
const beforeEach = async t => {
    const one = new User({
        username: 'one',
        email: 'one@example.com',
        password: 'onepass',
        roles: ['user'],
        apiKey: 'abc123'
    });
    const two = new User({
        username: 'two',
        email: 'two@example.com',
        password: 'twopass',
        roles: ['user']
    });
    const xo = new User({
        username: 'xo',
        email: 'xo@wvvw.me',
        password: 'xopass',
        roles: ['user', 'admin']
    });

    await Promise.all([one.save(), two.save(), xo.save()]);

    // Saves app to t.context so tests can access app
    t.context.app = app;
};

// Clean up database after every test
const afterEach = () => User.remove();

// Disconnect MongoDB and mongoose after all tests are done
const after = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
};

export {
    before,
    beforeEach,
    after,
    afterEach
};
