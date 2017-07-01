const mime = require('mime');
const serverFactory = require('spa-server');

const server = serverFactory.create({
    port: process.env.PORT || 3001,
    fallback: {
        [mime.lookup('html')]: '/index.html',
        [mime.lookup('js')]: './dist/build.js'
    }
});
server.start();
