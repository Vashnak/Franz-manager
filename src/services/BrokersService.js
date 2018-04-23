import ApiService from './ApiService';

export default {
    getBrokers() {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/brokers')
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