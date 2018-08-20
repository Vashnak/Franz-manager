import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader'
import Router from './Router';

import 'mdi/css/materialdesignicons.css';
import 'react-perfect-scrollbar/dist/css/styles.min.css'
import './core.scss';

import ThemesStore from "./stores/ThemesStore";

(function(elmProto){
        if ('scrollTopMax' in elmProto) {
            return;
        }
        Object.defineProperties(elmProto, {
            'scrollTopMax': {
                get: function scrollTopMax() {
                    return this.scrollHeight - this.clientTop;
                }
            },
            'scrollLeftMax': {
                get: function scrollLeftMax() {
                    return this.scrollWidth - this.clientLeft;
                }
            }
        });
    }
)(Element.prototype);

if (!global._babelPolyfill) {
    require('babel-polyfill');
}

const render = Component => {
    ReactDOM.render(
        <AppContainer>
            <Component />
        </AppContainer>,
        document.getElementById('root')
    )
};

render(Router);

ThemesStore.initTheme();

if (module.hot) {
    module.hot.accept('./Router', () => {
        const router = require('./Router').default;
        render(router)
    })
}
