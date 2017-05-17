import {Router} from 'express';
import numeral from 'numeral';

import {version} from '../package';
import {
    cors,
    blogUrl
} from '../middleware';

const app = new Router();

app.get('/', (req, res) => {
    res.send({
        version
    });
});

app.get('/blog/counter/followers/:blogUrl', cors, blogUrl, (req, res) => {
    const linkClass = req.query.class || '';
    const linkString = req.query.name ? req.query.name : 'followers';
    const fromTop = req.query.fromTop ? req.query.fromTop + (req.query.fromTop.slice(-2) === 'px' ? '' : 'px') : '26px';
    const fromRight = req.query.fromRight ? req.query.fromRight + (req.query.fromRight.slice(-2) === 'px' ? '' : 'px') : '4px';
    const goal = req.query.goal || 0;
    const goalString = req.query.goalName ? req.query.goalName : 'days till ' + (goal > 999 ? parseFloat((goal / 1000).toFixed(1)) + 'k' : goal);
    const gainsPerMonth = req.query.gainsPerMonth || 0;
    const gainsPerDay = gainsPerMonth ? (gainsPerMonth / 30) : req.query.gainsPerDay;
    const blog = res.blog;
    const followers = numeral(blog.followerCount).format('0,0');
    if (req.query.format === 'json') {
        res.send(followers);
    } else {
        res.setHeader('content-type', 'application/javascript');
        const href = `https://twistly.xyz/blog/${blogUrl}/stats/public`;
        if (goal) {
            let daysToGoal = Math.floor((goal - blog.followerCount) / gainsPerDay);
            daysToGoal = daysToGoal < 0 ? 0 : daysToGoal;
            res.send(`
                document.write('<a style="position: fixed; top: ${fromTop}; right: ${fromRight}" class="${linkClass}" href="${href}">${daysToGoal} ${goalString}</a>');
            `.trim());
        }
        if (!goal && req.query.format === 'simple') {
            res.send(`
                document.write('<a class="${linkClass}" href="${href}">${followers} ${linkString}</a>');
            `.trim());
        } else {
            res.send(`
                document.write('<a style="position: fixed; top: ${fromTop}; right: ${fromRight}" class="${linkClass}" href="${href}">${followers} ${linkString}</a>');
            `.trim());
        }
    }
});

export default app;
