import {Router} from 'express';

import {isAuthenticated} from '../middleware';

const router = new Router();

router.use(isAuthenticated);

router.get('/', async (req, res) => {
    res.send({
        user: req.user
    });
});

export default router;
