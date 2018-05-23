import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader'
import Router from './Router';

import 'react-perfect-scrollbar/dist/css/styles.css';
import 'materialize-css/dist/js/materialize.min';
import './core.scss';

const render = Component => {
    ReactDOM.render(
        <AppContainer>
            <Component />
        </AppContainer>,
        document.getElementById('root')
    )
};

render(Router);

if (module.hot) {
    module.hot.accept('./Router', () => {
        const router = require('./Router').default;
        render(router)
    })
}
