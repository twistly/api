const config = {
    db: {
        host: 'mongodb',
        port: 27017,
        collection: 'twistly'
    },
    session: {
        secret: 'asdjknl23knlknqlkwnd'
    },
    web: {
        port: 3000,
        baseUrl: process.env.BASE_URL || 'https://twistly.xyz'
    },
    tumblr: {
        token: process.env.TUMBLR_TOKEN || '',
        tokenSecret: process.env.TUMBLR_TOKEN_SECRET || ''
    },
    defaultPlanId: ''
};

export default config;
