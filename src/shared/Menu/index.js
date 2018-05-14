import React from 'react';
import PropTypes from 'prop-types';
import Classnames from 'classnames';
import './styles.css';

const defaultToggleButton = (
    <svg className="icon" viewBox="0 0 24 24" width="24px">
        <circle cx="4" cy="12" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="20" cy="12" r="2"/>
    </svg>
);

class Menu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hideContent: true,
            position: {},
            width: 0,
            height: 0
        };
    }

    componentDidMount() {
        this._updateWindowDimensions();
        window.addEventListener('resize', this._updateWindowDimensions.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._updateWindowDimensions.bind(this));
    }

    _updateWindowDimensions() {
        this.setState({width: window.innerWidth, height: window.innerHeight});
    }

    _toggleMenu(e) {
        if (this.state.hideContent) {
            this.setState({hideContent: false, position: e.target.getBoundingClientRect()});
        } else {
            this.setState({hideContent: true, position: {}});
        }
    }

    render() {
        const state = this.state;
        const menuContentStyle = {};
        if (state.position.top && state.position.right) {
            menuContentStyle.top = 15;
            menuContentStyle.right = 15;
        }
        return (
            <div className="menu">
                <span className="menu-toggle-button"
                      onClick={this._toggleMenu.bind(this)}>{this.props.toggleButton || defaultToggleButton}</span>
                <div className={Classnames("menu-content", {active: !state.hideContent})} style={menuContentStyle}>
                    <ul>
                        {this.props.children && this.props.children.map((child, index) => {
                            child.props.closeMenu = this._toggleMenu.bind(this);
                            return <li style={{delay: (index * 50) + 'ms'}}>{child}</li>
                        })}
                    </ul>
                </div>
            </div>
        );
    }
}

Menu.propTypes = {
    toggleButton: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element
    ])
};

export default Menu;