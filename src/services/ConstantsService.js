export default {
    apis: {
        franzManagerApi: {
            url: NODE_ENV === 'production' ? "%SERVER_URL%" : ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
                ? 'http://localhost:1337/franz-manager-api' : window.location.origin + '/franz-manager-api',
            webSocketUrl: NODE_ENV === 'production' ? "%WEBSOCKET_SERVER_URL%" : ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
                ? 'ws://localhost:5443/franz-manager-api' : window.location.origin + '/franz-manager-api'
        }
    }
}