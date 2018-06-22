import Constants from './ConstantsService';
import request from 'superagent';
import querystring from 'querystring';

export default {
    requestFranzManagerApi(method, route, bodyParams = {}, queryParams = {}) {
        return new Promise((resolve, reject) => {
            request(method, Constants.apis.franzManagerApi.url + route + '?' + querystring.stringify(queryParams))
                .set('clusterId', window.localStorage.getItem('selectedClusterId'))
                .send(bodyParams)
                .then(res => {
                    return resolve(res.body);
                })
                .catch(reject);
        });
    },
}
