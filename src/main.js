import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import passport from 'passport';
import session from 'express-session';
import jwt from 'express-jwt';
import {errorHandler, notFoundHandler} from 'express-api-error-handler';
import {Strategy as TumblrStrategy} from 'passport-tumblr';
import loudRejection from 'loud-rejection';
import config from './config';
import log from './log';
import {
    blog,
    queue,
    stat,
    token,
    user,
    web
} from './routes';

// Stops promises being silent
loudRejection();

const app = express();

app.use(jwt({
    secret: config.get('jwt.secret'),
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
    secret: 'keyboard cat',
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

app.use(errorHandler({
    log: ({err, req, body}) => {
        log.error(err, `${body.status} ${req.method} ${req.url}`);
    },
    // This hides 5XX errors in production to prevent info leaking
    hideProdErrors: true
}));

app.use(notFoundHandler({
    log: ({req}) => {
        log.info(`404 ${req.method} ${req.url}`);
    }
}));

export default app;
