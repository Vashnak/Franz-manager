import React, {Component} from 'react';

import Ink from 'react-ink';
import classnames from "classnames";

class Menu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false
        };
    }

    componentDidMount() {
        document.addEventListener('mousedown', this._handleClickOutside.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this._handleClickOutside.bind(this));
    }

    componentDidUpdate() {
        let dropdownBouding = this.refs[this.props.label].getBoundingClientRect();

        if (dropdownBouding.y + dropdownBouding.height + 24 > window.innerHeight) {
            this.refs[this.props.label].classList.add('reversed-menu');
        }
    }

    _handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this._close();
        }
    }

    _setWrapperRef(node) {
        this.wrapperRef = node;
    }

    _selectOption(option) {
        this.setState({selected: option});
        this.props.onChange(option);
    }

    _toggle() {
        this.setState({open: !this.state.open});
    }

    _close() {
        this.setState({open: false});
    }

    _calcDropDownPosition() {
        if (this.refs[this.props.label]) {
            let dropdownBouding = this.refs[this.props.label].getBoundingClientRect();
            if (this.refs[this.props.label].classList.contains('reversed-menu')) {
                return {
                    top: -8 - dropdownBouding.height
                }
            }
        }
        return {};
    }

    render() {
        let dropDownStyle = this._calcDropDownPosition();
        const {children} = this.props;
        const childrenWithProps = React.Children.map(children, child =>
            React.cloneElement(child, {closeMenu: this._close.bind(this)}));

        return (
            <div className={classnames({open: this.state.open}, "dropdown-menu", this.props.className)}
                 ref={this._setWrapperRef.bind(this)}>
                <button className="dropdown-menu-trigger" onClick={this._toggle.bind(this)}>
                    {this.props.label}
                    <i className="mdi mdi-24px mdi-chevron-down"/>
                    <Ink/>
                </button>
                <div className="dropdown-menu-content" ref={this.props.label} style={dropDownStyle}>
                    {childrenWithProps}
                </div>
            </div>
        );
    }
}

export default Menu;
