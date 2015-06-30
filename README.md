# Xtend

Make sure to be using nvm to install iojs or a version of node as new as the latest iojs

Once uploaded to a server if you run ``./install.sh`` everything should be good to go just create a ``config.js`` file in the root directory similar to the file below.

````
var config = {}

config.tumblr = {};
config.env = {};
config.db = {};

config.tumblr.token = process.env.TUMBLR_TOKEN || 'SECRET_CODE_HERE';
config.tumblr.tokenSecret =  process.env.TUMBLR_TOKEN_SECRET || 'SECRET_CODE_HERE';

config.env.port = process.env.PORT || 3000;
config.db.uri = process.env.DB_URI || 'mongodb://localhost:27017/xtend';

module.exports = config;

````


This is in no way affiliated with Tumblr, Inc., its partners, or its investors.
