import Database from '../api/database';
import {Tumblr} from '../api/oauth';
import {generalLogger as log} from '../api/log';

new Database('mongodb://localhost/twistly'); // eslint-disable-line

const stats = (job, done) => {
    const {data} = job.attrs;
    log.info(data);
    done();
    if (data.tumblr === undefined) {
        log.warn(`Disabling ${data.url} as it's missing it's Tumblr oauth token.`);
        job.fail(`Tumblr oauth missing.`);
        job.disable();
        job.save();
    }
    // const {token, secret} = data.tumblr;
    // const {userInfo} = new Tumblr({token, secret});
    // userInfo((error, data) => {
    //     if (error) {
    //         log.error(error);
    //     }
    //     log.info(data);
    //     done();
    // });
};

export default stats;
