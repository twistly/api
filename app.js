var express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    logger = require('express-logger'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    passport = require('./passportConfig.js'),
    config = require('./config.js'),
    User = require('./models/User'),
    Blog = require('./models/Blog'),
    Post = require('./models/Post'),
    Queue = require('./models/Queue');

mongoose.connect(config.db.uri, function(err){
    if(err){
        console.log('Is mongodb running?');
        process.exit();
    }
});

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

app.use(function(req, res, next){
    res.locals.user = req.user;
    next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/blog'));
app.use('/', require('./routes/web'));

fs.writeFile('./log.txt', '', function(){
    console.log('Log file emptied.');
});

app.listen(config.env.port, function() {
    console.log('Express server listening on port %s', config.env.port);
});
