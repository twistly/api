import {stat} from '../../api/';
import * as types from '../mutation-types';

const state = {
    stats: [],
    error: null,
    stack: null
};

const getters = {
    stats: state => state.stats,
    statError: state => state.error,
    statStack: state => state.stack
};

const actions = {
    getStats({commit}, {blogUrl, limit}) {
        return new Promise((resolve, reject) => {
            stat.getStats({blogUrl, limit}).then(({stats}) => {
                commit(types.STAT_RECIEVE_MULTIPLE, {stats});
                resolve({stats});
            }).catch(err => {
                const {error, stack} = err.response.data;
                commit(types.STAT_FAILURE, {error, stack});
                reject(err);
            });
        });
    }
};

const mutations = {
    // Add stats to the store
    [types.STAT_RECIEVE_MULTIPLE](state, {stats}) {
        state.stats = stats;
    },
    [types.STAT_FAILURE](state, {error, stack}) {
        state.error = error;
        state.stack = stack;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
