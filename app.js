const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const passport = require('passport');
const config = require('cz');

config.defaults({
    db: {
        host: 'mongodb',
        port: 27017,
        collection: 'xtend'
    },
    session: {
        secret: 'asdjknl23knlknqlkwnd'
    },
    web: {
        port: 3000,
        baseUrl: process.env.BASE_URL || 'https://xtend.wvvw.me'
    },
    tumblr: {
        token: process.env.TUMBLR_TOKEN || '',
        tokenSecret: process.env.TUMBLR_TOKEN_SECRET || ''
    },
    defaultPlanId: ''
});

config.load(path.normalize(path.join(__dirname, '/config.json')));
config.args();
config.store('disk');

mongoose.connect('mongodb://' + config.joinGets(['db:host', 'db:port', 'db:collection'], [':', '/']));

var app = express();

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
    secret: config.get('session:secret'),
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

app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

require('./app/config/passport.js')(app, passport);
app.use('/api/', require('./app/routes/api'));
app.use('/', require('./app/routes/chrome-extension'));
app.use('/', require('./app/routes/auth'));
app.use('/', require('./app/routes/web'));
app.use('/', require('./app/routes/blog'));

// Handle 404
app.use(function(req, res) {
    res.status(404).render('http/404', {
        title: '404: File Not Found'}
    );
});

// Handle 500
app.use(function(error, req, res) {
    res.status(500).render('http/500', {
        title: '500: Internal Server Error',
        error: error
    });
});

app.listen(config.get('web:port'), function() {
    console.log('The server is running on port %s', config.get('web:port'));
});
