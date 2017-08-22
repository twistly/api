import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import passport from 'passport';
import session from 'express-session';
import connectRedis from 'connect-redis';
import HTTPError from 'http-errors';
import jwt from 'express-jwt';
import {errorHandler, notFoundHandler} from 'express-api-error-handler';
import {Strategy as TumblrStrategy} from 'passport-tumblr';
import statusMonitor from 'express-status-monitor';
import loudRejection from 'loud-rejection';
import config from '../config';
import log from '../log';
import {User} from '../models';
import {blog, queue, stat, token, user, web} from '../routes';
import agenda from './agenda';

const RedisStore = connectRedis(session);

// Stops promises being silent
loudRejection();

const app = express();
app.use(statusMonitor({
    authorize: socket => {
        return new Promise(async resolve => {
            const url = socket.handshake.headers.referer;
            const apiKey = url.replace(/^\?/, '').split('?')[1].split('&').filter(param => {
                const [key] = param.split('=');
                return key === 'api_key' || key === 'apiKey';
            })[0].split('=')[1];
            if (apiKey) {
                log.debug(`Auth looks good using ${JSON.stringify({apiKey})} to check DB.`);
                const user = await User.findOne({apiKey}).lean().exec().catch(() => resolve(false));
                if (user) {
                    resolve(user.roles.indexOf('admin') !== -1);
                } else {
                    resolve(false);
                }
            }
        });
    }
}));

app.use(jwt({
    secret: process.env.JWT_SECRET || config.get('jwt.secret'),
    audience: 'https://api.twistly.xyz',
    issuer: 'https://api.twistly.xyz',
    requestProperty: 'jwt',
    credentialsRequired: false
}).unless({
    path: [{
        url: '/token',
        methods: ['POST']
    }, {
        url: '/user',
        methods: ['POST']
    }]
}));

passport.use(new TumblrStrategy({
    consumerKey: process.env.TUMBLR_CONSUMER_KEY,
    consumerSecret: process.env.TUMBLR_CONSUMER_SECRET
}, async (token, secret, profile, done) => {
    done(null, {}, {token, secret, profile});
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return next(new Error('Invalid JSON.'));
    }
    return next(err);
});
app.use(methodOverride());
app.use(session({
    store: new RedisStore({
        url: process.env.REDIS_URL || config.get('redis.uri')
    }),
    secret: process.env.SESSION_SECRET || config.get('session.secret'),
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.use('/blog', blog);
app.use('/queue', queue);
app.use('/stat', stat);
app.use('/token', token);
app.use('/user', user);
app.use('/', web);
app.use('/healthcheck', (req, res) => {
    res.status(200).json({
        uptime: process.uptime()
    });
});

app.use((err, req, res, next) => {
    if (err.code !== 'invalid_token') {
        return next(err);
    }

    return next(new HTTPError.Unauthorized('Token expired.'));
});

app.use(errorHandler({
    log: ({err, req, body}) => {
        if (body.status >= 500) {
            log.error(err, `${body.status} ${req.method} ${req.url}`);
        }
    },
    // This hides 5XX errors in production to prevent info leaking
    hideProdErrors: false
}));

app.use(notFoundHandler({
    log: ({req}) => {
        log.info(`404 ${req.method} ${req.url}`);
    }
}));

export default app;
export {
    app,
    agenda
};
