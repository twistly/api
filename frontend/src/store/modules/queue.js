import {queue} from '../../api/';
import * as types from '../mutation-types';

const state = {
    queues: [],
    error: null,
    stack: null
};

const getters = {
    queues: state => state.queues,
    queueError: state => state.error,
    queueStack: state => state.stack
};

const actions = {
    // Gets all the queues from Twistly
    getQueues({commit}) {
        return new Promise((resolve, reject) => {
            queue.getQueues().then(({queues}) => {
                commit(types.QUEUE_RECIEVE_MULTIPLE, {queues});
                resolve({queues});
            }).catch(err => {
                const {error, stack} = err.response.data;
                commit(types.QUEUE_FAILURE, {error, stack});
                reject(err);
            });
        });
    }
};

const mutations = {
    [types.QUEUE_RECIEVE_MULTIPLE](state, {queues}) {
        state.queues = queues;
    },
    [types.QUEUE_FAILURE](state, {error, stack}) {
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
