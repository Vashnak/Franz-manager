import request from 'superagent';
import querystring from 'querystring';
import Constants from './ConstantsService';

export default {
  requestFranzManagerApi(method, route, bodyParams = {}, queryParams = {}, clusterId = null) {
    return new Promise((resolve, reject) => {
      request(method, `${Constants.apis.franzManagerApi.url + route}?${querystring.stringify(queryParams)}`)
        .set('clusterId', clusterId || window.localStorage.getItem('selectedClusterId'))
        .send(bodyParams)
        .then(res => resolve(res.body))
        .catch(reject);
    });
  },

  getApiStatus() {
    return new Promise((resolve, reject) => {
      this.requestFranzManagerApi('GET', '/status')
        .then(resolve)
        .catch(reject);
    });
  },
};
