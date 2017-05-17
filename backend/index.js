import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import log from './log';
import config from './config';
import passportConfig from './config/passport';
import {twistly} from './package';
import {
    api,
    auth,
    blog,
    chromeExtension,
    web
} from './routes';

const MongoStore = require('connect-mongo')(session);

const env = process.env.NODE_ENV || 'production';
const port = twistly.port[env];

mongoose.Promise = Promise;

mongoose.connect('mongodb://localhost:27017/twistly');
if (env !== 'production') {
    mongoose.set('debug', true);
}

const app = express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '/public')));
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
app.use('/api/', api);
app.use('/', chromeExtension);
app.use('/', auth);
app.use('/', web);
app.use('/', blog);

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

app.listen(port, () => log.info(`The server is running on port ${port}`));
