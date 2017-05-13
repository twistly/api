import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import mongoose from 'mongoose';
import passport from 'passport';
import passportConfig from './app/config/passport';

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const config = {
    db: {
        host: 'mongodb',
        port: 27017,
        collection: 'twistly'
    },
    session: {
        secret: 'asdjknl23knlknqlkwnd'
    },
    web: {
        port: 3000,
        baseUrl: process.env.BASE_URL || 'https://twistly.xyz'
    },
    tumblr: {
        token: process.env.TUMBLR_TOKEN || '',
        tokenSecret: process.env.TUMBLR_TOKEN_SECRET || ''
    },
    defaultPlanId: ''
};

mongoose.connect('mongodb://localhost:27017/twistly');
if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
}

const app = express();

app.set('views', path.join(__dirname, '/app/views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, '/app/public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    secret: config.session.secret,
    name: 'session',
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

passportConfig(app, passport);
app.use('/api/', require('./app/routes/api'));
app.use('/', require('./app/routes/chrome-extension'));
app.use('/', require('./app/routes/auth'));
app.use('/', require('./app/routes/web'));
app.use('/', require('./app/routes/blog'));

app.use((req, res) => {
    res.status(404).render('http/404', {
        title: '404: File Not Found'}
    );
});

app.use((error, req, res) => {
    res.status(500).render('http/500', {
        title: '500: Internal Server Error',
        error
    });
});

app.listen(3000, () => {
    console.log('The server is running on port 3000');
});
