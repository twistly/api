import Vue from 'vue';
import VueRouter from 'vue-router';

import HomeComponent from '../components/home.vue';
import AccountComponent from '../components/account.vue';

import TumblrComponent from '../components/tumblr.vue';
import TumblrStatsComponent from '../components/tumblr/stats.vue';
import TumblrQueuesComponent from '../components/tumblr/queues.vue';
import TumblrCounterComponent from '../components/tumblr/counter.vue';

import SigninComponent from '../components/signin.vue';
import SignupComponent from '../components/signup.vue';
import SignoutComponent from '../components/signout.vue';

import NotFoundComponent from '../components/not-found.vue';

Vue.use(VueRouter);

const routes = [{
    name: 'home',
    path: '/',
    component: HomeComponent
}, {
    name: 'account',
    path: '/account',
    component: AccountComponent,
    meta: {
        auth: true
    }
}, {
    name: 'tumblr',
    path: '/tumblr',
    component: TumblrComponent,
    children: [{
        name: 'stats',
        path: 'stats',
        component: TumblrStatsComponent
    }, {
        name: 'queues',
        path: 'queues',
        component: TumblrQueuesComponent,
        meta: {
            auth: true
        }
    }, {
        name: 'counter',
        path: 'counter',
        component: TumblrCounterComponent,
        meta: {
            auth: true
        }
    }],
    meta: {
        auth: true
    }
}, {
    name: 'signin',
    path: '/signin',
    component: SigninComponent
}, {
    name: 'signup',
    path: '/signup',
    component: SignupComponent
}, {
    name: 'signout',
    path: '/signout',
    component: SignoutComponent
}, {
    name: 'not-found',
    path: '*',
    component: NotFoundComponent
}];

const router = new VueRouter({
    routes,
    mode: 'history'
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    if (to.meta.auth && !token) {
        return next({name: 'home'});
    }
    next();
});

export default router;
