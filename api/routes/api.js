import {Router} from 'express';
import numeral from 'numeral';

import {version} from '../package';
import {
    cors,
    resolveBlogUrl
} from '../middleware';

const app = new Router();

app.get('/', (req, res) => {
    res.send({
        version
    });
});

export default app;
