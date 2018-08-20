import ApiService from './ApiService';

export default {
    getBrokers(clusterId = null) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/brokers', null, null, clusterId)
                .then(resolve)
                .catch(reject);
        })
    },

    getBrokersDetails(brokerId) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/brokers/' + brokerId)
                .then(resolve)
                .catch(reject);
        });
    }
}
