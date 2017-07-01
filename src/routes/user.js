import {Router} from 'express';
import Joi from 'joi';
import HTTPError from 'http-errors';
import dumbPasswords from 'dumb-passwords';
import {isAuthenticated} from '../middleware';
import {User} from '../models';
import log from '../log';

const router = new Router();

router.get('/', isAuthenticated, async (req, res) => {
    res.send({
        user: req.user
    });
});

router.post('/', (req, res, next) => {
    Joi.validate({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email
    }, {
        username: Joi.string().required(),
        password: Joi.string().required().min(5).max(128),
        email: Joi.string().email().required()
    }, async (error, values) => {
        if (error) {
            return next(error);
        }
        const {username, password, email} = values;
        if (dumbPasswords.check(password)) {
            return next(new HTTPError.UnprocessableEntity('Invalid password.'));
        }

        const user = new User({
            username,
            password,
            email
        });
        user.save(error => {
            if (error) {
                log.error(error);
                return res.send(new HTTPError.InternalServerError(`User could not be saved.`));
            }
            // Just to be sure we remove the password here incase the hashing fucks up somehow.
            delete user.password;
            return res.status(201).send({user});
        });
    });
});

export default router;
