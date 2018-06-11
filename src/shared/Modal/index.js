import React from 'react';
import {PortalWithState} from 'react-portal';
import './styles.css';

class Modal extends React.Component {
    constructor(props) {
        super(props);
        this.id = Math.random().toFixed(0);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render() {
        return <div className={"modal-component " + (this.props.className || "")}>
            <div className="content">
                <PortalWithState isOpen={true}>
                    {() => this.props.children}
                </PortalWithState>
            </div>
        </div>
    }
}

export default Modal;
