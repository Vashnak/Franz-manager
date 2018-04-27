import React from 'react';

import './Error.scss';

class Error extends React.Component {
    render() {
        return (
            <div className="error-block">
                <span className="error-message">{this.props.error}</span>
            </div>
        );
    }
}

export default Error;