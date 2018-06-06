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
        this.id = Math.random().toFixed(0);
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
            this.refs[this.id].className = "menu-content active";
            this.setState({hideContent: false, position: e.target.getBoundingClientRect()});
        } else {
            this.refs[this.id].className = "menu-content";
            this.setState({hideContent: true, position: {}});
        }
    }

    render() {
        let children = [];
        if(this.props.children){
            children = Array.isArray(this.props.children) ? this.props.children : [this.props.children]
        }
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
                <div ref={this.id} className="menu-content" style={menuContentStyle}>
                    <ul>
                        {children.map((child, index) => {
                            let clonedChild = React.cloneElement(child, {
                                ...child.props,
                                closeMenu: this._toggleMenu.bind(this)
                            });
                            return <li key={index}>{clonedChild}</li>
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
