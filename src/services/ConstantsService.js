export default {
    apis: {
        franzManagerApi: {
            url: ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
                ? 'http://localhost:1337/franz-manager-api' : window.location.origin + '/franz-manager-api'
        }
    },
    gcn_tools_api: {
        url: 'https://dev-infra.energy-app.net/gcn-tools-api'
    },
    tree_view: true
}