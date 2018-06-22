import ApiService from './ApiService';

export default {
    getClusters() {
        return new Promise((resolve, reject) => {
            if(localStorage.getItem("clusters")){
                return resolve(JSON.parse(localStorage.getItem("clusters")));
            }

            ApiService.requestFranzManagerApi('GET', '/clusters')
                .then(res => {
                    window.localStorage.setItem("clusters", JSON.stringify(res));
                    return resolve(JSON.parse(localStorage.getItem("clusters")));
                })
                .catch(reject);
        })
    },

    getSelectedClusterId(){
        return localStorage.getItem("selectedClusterId");
    },

    setSelectedClusterId(clusterId){
        return localStorage.setItem("selectedClusterId", clusterId);
    }
}
