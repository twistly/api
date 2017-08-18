import crypto from 'crypto';
import Configstore from 'configstore';
import {name, version} from '../../package';

const config = new Configstore(name, {
    app: {
        port: 3000,
        title: 'Twistly',
        name,
        version
    },
    database: {
        enabled: true,
        url: 'mongodb://localhost/twistly'
    },
    log: {
        directory: './logs/error.log'
    },
    session: {
        secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
        uri: process.env.REDIS_URL || 'redis://127.0.0.1:8888'
    },
    jwt: {
        secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex')
    },
    bcrypt: {
        rounds: 10
    },
    signups: {
        enabled: true
    },
    url: process.env.BASE_URL || 'https://twistly.xyz',
    tumblr: {
        token: process.env.TUMBLR_TOKEN || '',
        tokenSecret: process.env.TUMBLR_TOKEN_SECRET || ''
    },
    defaultPlanId: process.env.PLAN_ID || '5915b29ecc79a276b591b817' // @TODO: Create this doc if missing on first boot
});

export default config;
