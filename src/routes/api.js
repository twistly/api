import {Router} from 'express';

import {version} from '../../package';

const app = new Router();

app.get('/', (req, res) => {
    res.send({
        version
    });
});

export default app;
