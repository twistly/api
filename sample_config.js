var config = {};

config.tumblr = {};
config.env = {};
config.db = {};
config.db.session = {};

config.tumblr.token = process.env.TUMBLR_TOKEN || 'FAKE_TOKEN';
config.tumblr.tokenSecret = process.env.XTEND.TUMBLR_TOKEN_SECRET || 'FAKE_SECRET_TOKEN';

config.env.port = process.env.XTEND_PORT || 3000;
config.env.emptyLog = process.env.XTEND_EMPTY_LOG || true;
config.env.baseUrl = process.env.XTEND_BASE_URL || 'http://wvvw.me';

config.db.uri = process.env.XTEND_DB_URI || 'mongodb://localhost:27017/xtend';
config.db.session.secret = process.env.XTEND_DB_SESSION_SECRET ||'FAKE_SESSION_SECRET';
config.db.defaultPlanId = process.env.XTEND_DEFAULT_PLAN_ID || 'FAKE_PLAN_ID';

module.exports = config;
