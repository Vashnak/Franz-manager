import ApiService from './ApiService';

export default {
  getClusters() {
    return new Promise((resolve, reject) => {
      if (localStorage.getItem('clusters')) {
        resolve(JSON.parse(localStorage.getItem('clusters')));
      }

      ApiService.requestFranzManagerApi('GET', '/clusters')
        .then((res) => {
          if (!localStorage.getItem('clusters')) {
            resolve(res);
          }
          window.localStorage.setItem('clusters', JSON.stringify(res));
        })
        .catch(reject);
    });
  },

  getSelectedClusterId() {
    return localStorage.getItem('selectedClusterId');
  },

  setSelectedClusterId(clusterId) {
    localStorage.setItem('selectedClusterId', clusterId);
  },
};
