import test from 'ava';
import request from 'supertest';
import {before, beforeEach, afterEach, after} from './helpers';

test.before(before);
test.beforeEach(beforeEach);

test('returns 404', async t => {
    const {app} = t.context;
    const res = await request(app).get('/' + Math.random().toString(36));

    t.is(res.status, 404);
    t.deepEqual(res.body, {
        error: 'route not found',
        status: 404
    });
});

// @TODO: Need to add find why I can't add a route after importing app
test.failing('returns 5XX error without stack', async t => {
    const {app} = t.context;
    app.use('/500', (res, req, next) => {
        return next(new Error('test error'));
    });
    const res = await request(app).get('/500');

    t.is(res.status, 500);
    t.deepEqual(res.body, {
        errr: 'server error',
        status: 500
    });
});

test.afterEach.always(afterEach);
test.after.always(after);
