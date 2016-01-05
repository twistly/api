var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose'),
    passport = require('passport'),
    config = require('./app/config/config.js');

mongoose.connect(config.db.uri, function(err){
    if(err){
        console.log('Is mongodb running?');
        process.exit();
    }
});

var app = express();

app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/app/public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    secret: config.db.session.secret,
    name: 'session',
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
    res.locals.user = req.user;
    next();
});

require('./app/config/passport.js')(app, passport);
app.use('/api/', require('./app/routes/api'));
app.use('/', require('./app/routes/chromeExtension'));
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
        title:'500: Internal Server Error',
        error: error
    });
});

app.listen(config.env.port, function() {
    console.log('Xtend is running on port %s', config.env.port);
});
