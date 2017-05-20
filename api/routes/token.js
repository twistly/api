import jwt from 'jsonwebtoken';
import {Router} from 'express';
import {User} from '../models';
import config from '../config';

const router = new Router();

router.post('/', async (req, res, next) => {
    const user = await User.findOne({username: req.body.username}).exec().catch(err => next(err));
    if (user) {
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (err) {
                return next(err);
            }
            if (!isMatch) {
                return next(new Error(`The username and/or password you provided don't match any current user.`));
            }
            jwt.sign({
                username: user.username,
                iat: Math.floor(Date.now() / 1000) - 10 // Set issue date 10 seconds ago
            }, config.jwt.secret, {
                expiresIn: 3600,
                issuer: 'twistly.xyz'
            }, (err, token) => {
                if (err) {
                    return next(err);
                }
                return res.status(201).json({
                    token
                });
            });
        });
    } else {
        return next(new Error(`The username and/or password you provided don't match any current user.`));
    }
});

export default router;
