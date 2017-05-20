import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import {errorHandler, notFoundHandler} from 'express-api-error-handler';
import {Strategy as TumblrStrategy} from 'passport-tumblr';
import log from './log';
import config from './config';
import {
    api,
    blog,
    queue,
    token,
    web
} from './routes';

const env = process.env.NODE_ENV || 'production';
const port = config.port;
const app = express();

passport.use(new TumblrStrategy({
    consumerKey: process.env.TUMBLR_CONSUMER_KEY,
    consumerSecret: process.env.TUMBLR_CONSUMER_SECRET,
    callbackURL: '/auth/tumblr/callback'
}, (token, tokenSecret, profile, done) => {
    done(null, null, {
        token,
        tokenSecret,
        profile
    });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

mongoose.Promise = Promise;

mongoose.connect('mongodb://localhost:27017/twistly');
if (env !== 'production') {
    mongoose.set('debug', (coll, method, query, doc, options) => {  // eslint-disable-line max-params
        log.info({
            query: {
                coll,
                method,
                query,
                doc,
                options
            }
        });
    });
}

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.use('/api/', api);
app.use('/', web);
app.use('/token', token);
app.use('/blog', blog);
app.use('/queue', queue);

app.use(errorHandler({
    log: ({err, req, body}) => {
        log.error(err, `${body.status} ${req.method} ${req.url}`);
    }
}));

app.use(notFoundHandler({
    log: ({req}) => {
        log.info(`404 ${req.method} ${req.url}`);
    }
}));

app.listen(port, () => log.info(`The server is running on port ${port}`));
