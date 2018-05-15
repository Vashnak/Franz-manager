import ApiService from './ApiService';

export default {
    getTopics() {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics', null, {idOnly: true})
                .then(resolve)
                .catch(reject);
        })
    },

    getTopicDetails(topicId) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics/' + topicId, null)
                .then(resolve)
                .catch(reject);
        });
    },

    getTopicMetrics(topicId, metricName) {
        return new Promise((resolve, reject) => {
            const queryParams = {metricName, metricType: "BrokerTopicMetrics"};
            if (topicId) {
                queryParams.topic = topicId;
            }
            ApiService.requestFranzManagerApi('GET', '/metrics', null, queryParams)
                .then(resolve)
                .catch(reject);
        });
    },

    getTopicPartitions(topicId) {
        return new Promise((resolve, reject) => {
            ApiService.requestFranzManagerApi('GET', '/topics/' + topicId + '/partitions', null)
                .then(resolve)
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
                    console.log(res.length)
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
            ApiService.requestFranzManagerApi('POST', '/topics', {id: topicName, partitions: 3, replication: 3}, null)
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