var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    logger = require('express-logger'),
    mongoose = require('mongoose'),
    passport = require('./passportConfig.js'),
    config = require('./config.js'),
    User = require('./models/User'),
    Blog = require('./models/Blog'),
    Post = require('./models/Post'),
    Queue = require('./models/Queue');

mongoose.connect(config.db.uri);

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(logger({path: './log.txt'}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    secret: 'keyboard cat',
    name: 'session',
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/web'));

app.listen(config.env.port, function() {
    console.log('Express server listening on port %s', config.env.port);
});
