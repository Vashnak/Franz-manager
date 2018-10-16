import React, {Component} from 'react';
import PropTypes from 'prop-types';

class Loadbar extends Component {
    static propTypes = {
        timer: PropTypes.number
    };

    constructor(props) {
        super(props);

        this.state = {
            currentTime: 0
        };

        this.interval = setInterval(() => {
            this.setState({currentTime: this.state.currentTime + 100});
            if (this.state.currentTime >= (this.props.timer || 3000)) {
                clearInterval(this.interval);
            }
        }, 100)
    }

    componentWillReceiveProps(props) {
        if (props.finished) {
            this.setState({currentTime: props.timer});
            setTimeout(() => {
                if (this.refs["loadbar-component"]) {
                    this.refs["loadbar-component"].style.display = "none";
                }
            }, 300);
        }
    }

    render() {
        return (
            <div className="loadbar-component" ref="loadbar-component">
                <div ref="fill" className="fill"
                     style={{width: (this.state.currentTime / (this.props.timer || 3000) * 100) + '%'}}/>
            </div>
        );
    }
}

export default Loadbar;
