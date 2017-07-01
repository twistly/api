import {user} from '../../api/';
import * as types from '../mutation-types';

const state = {
    user: {
        roles: []
    },
    error: null
};

const getters = {
    user: state => state.user,
    userError: state => state.error,
    // https://alligator.io/vuejs/intro-to-vuex/
    hasRole: state => {
        return role => {
            return state.user.roles.indexOf(String(role)) >= 0;
        };
    }
};

const actions = {
    // Gets the user from Twistly
    getUser({commit}) {
        return new Promise((resolve, reject) => {
            user.getUser().then(({user}) => {
                commit(types.USER_RECIEVE_SINGLUAR, {user});
                resolve({user});
            }).catch(err => {
                const {error, stack} = err.response.data;
                commit(types.USER_FAILURE, {error, stack});
                reject(err);
            });
        });
    }
};

const mutations = {
    // Add user to the store
    [types.USER_RECIEVE_SINGLUAR](state, {user}) {
        state.user = user;
    },
    [types.USER_FAILURE](state, {error}) {
        state.error = error;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};
