var config = {}

config.tumblr = {};
config.env = {};
config.db = {};
config.db.session = {};

config.tumblr.token = process.env.XTEND.TUMBLR_TOKEN || 'FAKE_TOKEN';
config.tumblr.tokenSecret = process.env.XTEND.TUMBLR_TOKEN_SECRET || 'FAKE_SECRET_TOKEN';

config.env.port = process.env.XTEND.PORT || 3000;
config.env.emptyLog = process.env.XTEND.EMPTY_LOG || true;
config.env.baseUrl = process.env.XTEND.BASE_URL || 'http://xtend.wvvw.me';

config.db.uri = process.env.XTEND.DB_URI || 'mongodb://localhost:27017/xtend';
config.db.session.secret = process.env.XTEND.DB_SESSON.SECRET || 'keyboard cat';
config.db.defaultPlanId = process.env.XTEND.DB_DEFAULT_PLAN_ID || 'FAKE_PLAN_ID';

module.exports = config;
