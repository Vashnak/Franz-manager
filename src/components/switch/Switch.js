import React, {Component} from 'react';

import classnames from "classnames";
import Ink from 'react-ink';

class Switch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: typeof this.props.value === 'boolean' ? this.props.value : false
        }
    }

    _toggle() {
        if (this.props.onChange) {
            this.props.onChange(!this.state.value);
        }
        this.setState({value: !this.state.value});
    }

    render() {
        return (
            <div className={"switch-wrapper " + this.props.className}>
                <div className="switch-label">{this.props.label}</div>
                <div className={classnames({on: this.state.value}, "switch")} onClick={this._toggle.bind(this)}>
                    <span className="switch-value">{this.state.value ? 'ON' : 'OFF'}</span>
                    <div className="switch-handle ellipse"></div>
                    <Ink/>
                </div>
            </div>
        );
    }
}

export default Switch;
