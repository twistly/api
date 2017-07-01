import Vue from 'vue';
import Vuex from 'vuex';
import auth from './modules/auth';
import blog from './modules/blog';
import queue from './modules/queue';
import stat from './modules/stat';
import user from './modules/user';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
    modules: {
        auth,
        blog,
        queue,
        stat,
        user
    },
    strict: debug
});
