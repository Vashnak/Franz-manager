import ApiService from './ApiService';

export default {
    getApps() {
        return new Promise((resolve, reject) => {
            ApiService.requestGcnToolsApi('GET', '/apps?codenameOnly=true')
                .then(resolve)
                .catch(reject);
        })
    }
}