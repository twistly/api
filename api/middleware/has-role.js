import HTTPErrors from 'http-errors';

import {apiLogger as log} from '../log';

const hasRole = role => {
    return (req, res, next) => {
        role = role.toLowerCase();
        if (req.user.roles.indexOf(role) === -1) {
            if (role === 'admin') {
                log.info(`${req.user.username} tried accessing ${req.route}`);
                return next(new HTTPErrors.Forbidden(`You need to be an admin to access this page.`));
            }
            return next(new HTTPErrors.Forbidden());
        }
        return next();
    };
};

export default hasRole;
