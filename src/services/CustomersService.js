import ApiService from './ApiService';

export default {
    getCustomers() {
        return new Promise((resolve, reject) => {
            ApiService.requestGcnToolsApi('GET', '/customers')
                .then(resolve)
                .catch(reject);
        })
    }
}