const serverUrl = '%SERVER_URL%' || null;
const websocketUrl = '%WEBSOCKET_SERVER_URL%' || null;

export default {
  apis: {
    franzManagerApi: {
      url: NODE_ENV === 'production' && serverUrl ? serverUrl : ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
        ? 'http://localhost:1337-api' : `${window.location.origin}-api`,
      webSocketUrl: NODE_ENV === 'production' && websocketUrl ? websocketUrl : ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
        ? 'ws://localhost:5443-api' : `wss://${window.location.host}-api`,
    },
  },
};
