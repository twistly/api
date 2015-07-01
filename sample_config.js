var config = {}

config.tumblr = {};
config.env = {};
config.db = {};

config.tumblr.token = process.env.TUMBLR_TOKEN || 'FAKE_TOKEN';
config.tumblr.tokenSecret =  process.env.TUMBLR_TOKEN_SECRET || 'FAKE_TOKEN_SECRET';

config.env.port = process.env.PORT || 3000;
config.env.baseUrl = process.env.BASE_URL || 'http://xtend.wvvw.me';
config.db.uri = process.env.DB_URI || 'mongodb://localhost:27017/xtend';

module.exports = config;
