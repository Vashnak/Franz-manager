import React from 'react';
import {PortalWithState} from 'react-portal';
import '../../core.scss';
import Ink from 'react-ink';

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
        return <div className={"modal component " + (this.props.className || "")}>
            <div className="content">
                <header>
                    <h2>{this.props.title}</h2>

                    {this.props.actions && this.props.actions.map(a => <button className="toggle margin-left-16px"
                                                                                    onClick={a.action}>{a.label}</button>)}

                    <button onClick={this.props.close}>
                        <i className="mdi mdi-24px mdi-close"/>
                        <Ink/>
                    </button>
                </header>
                <PortalWithState isOpen={true}>
                    {() => this.props.children}
                </PortalWithState>
            </div>
        </div>
    }
}

export default Modal;
