import axios from 'axios';

import {apiLogger as log} from '../log';

const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? 'https://api.twistly.xyz' : 'http://localhost:3000/',
    timeout: 10000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(request => {
    const token = localStorage.getItem('token');
    const headers = request.headers || (request.headers = {});

    if (token !== null && token !== 'undefined') {
        // @TODO: Switch back to Bearer once we have jwt added properly
        log.debug(`setting token to ${token}`);
        headers.Authorization = `Bearer ${token}`;
    }

    return request;
}, err => Promise.reject(err));

api.interceptors.response.use(response => {
    if (response.status && (response.status.code === 401 || response.status.code === 403)) {
        localStorage.removeItem('token');
    }

    return response;
}, err => Promise.reject(err));

export default api;
