import test from 'ava';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import config from '../src/config';
import {User} from '../src/models';
import {before, beforeEach, afterEach, after} from './helpers';

test.before(before);
test.beforeEach(beforeEach);

test.serial('returns the user', async t => {
    const {app} = t.context;
    const res = await request(app).get('/user?api_key=abc123');
    t.is(res.status, 200);
    t.is(res.body.user.username, 'one');
    t.is(res.body.user.email, 'one@example.com');
});

test.serial('creates user then returns jwt', async t => {
    const {app} = t.context;
    const res = await request(app).post('/user?api_key=abc123').send({
        username: 'New name',
        email: 'new@example.com',
        password: 'randompassword'
    });

    t.is(res.status, 201);
    jwt.verify(res.body.token, config.get('jwt.secret'), (err, decoded) => {
        t.ifError(err);
        t.is(decoded.username, 'New name');
        t.true(decoded.roles.includes('user'));
    });

    // Verifies that user is created in DB
    const newUser = await User.findOne({email: 'new@example.com'}).lean().exec();
    t.is(newUser.username, 'New name');
    t.true(newUser.roles.includes('user'));
});

test.afterEach.always(afterEach);
test.after.always(after);
