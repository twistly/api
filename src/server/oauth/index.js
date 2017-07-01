import tumblr from 'tumblr.js';
import config from '../config';

const Tumblr = opts => {
    opts = opts || {};
    return tumblr.createClient({
        consumer_key: config.get('tumblr.token'), // eslint-disable-line camelcase
        consumer_secret: config.get('tumblr.secret'), // eslint-disable-line camelcase
        token: opts.token, // eslint-disable-line camelcase
        token_secret: opts.secret // eslint-disable-line camelcase
    });
};

export {
    Tumblr // eslint-disable-line import/prefer-default-export
};
