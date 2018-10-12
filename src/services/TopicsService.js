import ApiService from './ApiService';

export default {
    getStoredData(dataString) {
        let cluster = localStorage.getItem("selectedClusterId");
        if (cluster) {
            try {
                return JSON.parse(localStorage.getItem(cluster + '-' + dataString));
            } catch (e) {
                return localStorage.getItem(cluster + '-' + dataString)
            }
        }
        return null;
    },

    getTopics(shortVersion) {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics', null, shortVersion ? {shortVersion: true} : {idOnly: true})
                .then(topics => {
                    let cluster = localStorage.getItem("selectedClusterId");
                    if (cluster) {
                        try {
                            localStorage.setItem(cluster + "-topics", JSON.stringify(topics));
                        } catch (e) {
                            // looks like it's too big :(
                        }
                    }
                    localStorage.setItem(cluster + "-topics-time", JSON.stringify(Date.now() - start));
                    return resolve(topics);
                })
                .catch(reject);
        })
    },

    getGlobalTopicsMetrics() {
        const start = Date.now();
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/metrics/topics')
                .then(topicsMetrics => {
                    let cluster = localStorage.getItem("selectedClusterId");
                    if (cluster) {
                        try {
                            localStorage.setItem(cluster + "-topics-metrics", JSON.stringify(topicsMetrics));
                        } catch (e) {
                            // looks like it's too big :(
                        }
                    }
                    localStorage.setItem(cluster + "-topics-metrics-time", JSON.stringify(Date.now() - start));
                    return resolve(topicsMetrics);
                })
                .catch(reject);
        })
    },

    getTopicDetails(topicId) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics/' + topicId, null)
                .then(tDetails => {
                    let cluster = localStorage.getItem("selectedClusterId");
                    let topicsDetails = {};
                    if (cluster) {
                        try {
                            topicsDetails = JSON.parse(localStorage.getItem(cluster + "-topicsDetails"));
                        } catch (e) {
                            topicsDetails = {};
                        }
                        localStorage.setItem(cluster + "-topicsDetails", JSON.stringify(tDetails));
                    }
                    topicsDetails[topicId] = tDetails;
                    localStorage.setItem(cluster + "-topicsDetails", topicsDetails);

                    return resolve(tDetails);
                })
                .catch(reject);
        });
    },

    getTopicPartitions(topicId) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics/' + topicId + '/partitions', null)
                .then(tPartitions => {
                    let cluster = localStorage.getItem("selectedClusterId");
                    let topicsPartitions = {};
                    if (cluster) {
                        try {
                            topicsPartitions = JSON.parse(localStorage.getItem(cluster + "-topicsPartitions"));
                        } catch (e) {
                            topicsPartitions = {};
                        }
                        localStorage.setItem(cluster + "-topicsPartitions", JSON.stringify(tPartitions));
                    }
                    topicsPartitions[topicId] = tPartitions;
                    localStorage.setItem(cluster + "-topicsPartitions", topicsPartitions);
                    return resolve(tPartitions);
                })
                .catch(reject);
        });
    },

    addTopicPartitions(topicId, quantity) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('POST', '/topics/' + topicId + '/partitions', null, {quantity})
                .then(resolve)
                .catch(reject);
        });
    },

    getLastTopicMessages(topicId, quantity, timestamp) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics/' + topicId + '/messages', null, {
                quantity: quantity || 10,
                from: timestamp
            })
                .then(res => {
                    if (res.length === 0) {
                        return reject('No message for this topic.');
                    }
                    return resolve(res);
                })
                .catch(reject);
        });
    },

    addTopic(topicName) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('POST', '/topics', {id: topicName, replication: 1}, null)
                .then(res => {
                    return resolve(res);
                })
                .catch(reject);
        });
    },

    updateTopicConfiguration(topicId, configuration) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('PUT', '/topics/' + topicId, configuration)
                .then(res => {
                    return resolve(res);
                })
                .catch(reject);
        });
    },

    deleteTopic(topicName) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('DELETE', '/topics/' + topicName, null, null)
                .then(res => {
                    return resolve(res);
                })
                .catch(reject);
        });
    }
}
