import path from 'path';
import {Etcd3} from 'etcd3';
import config from '../config';

const etcd = new Etcd3();

const announce = () => {
    const key = path.join('/', 'services', 'twistly', 'api');
    const data = JSON.stringify({
        port: config.get('port'),
        pid: process.pid
    });
    etcd.put(key).value(data);

    setTimeout(announce, 5000);

    return key;
};

export default announce;
