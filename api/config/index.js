const config = {
    db: {
        host: 'mongodb',
        port: 27017,
        collection: 'twistly'
    },
    port: 3000,
    url: process.env.BASE_URL || 'https://twistly.xyz',
    tumblr: {
        token: process.env.TUMBLR_TOKEN || '',
        tokenSecret: process.env.TUMBLR_TOKEN_SECRET || ''
    },
    defaultPlanId: '',
    jwt: {
        secret: 'asdjknl23knlknqlkwnd'
    }
};

export default config;
