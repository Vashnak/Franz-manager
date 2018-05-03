import React, {Component} from 'react';
import Classnames from 'classnames';
import PropTypes from 'prop-types';

import SpeedometerIcon from 'mdi-react/SpeedometerIcon';
import ViewParallelIcon from 'mdi-react/ViewParallelIcon';
import FormatListNumbersIcon from 'mdi-react/FormatListNumbersIcon';
import AccountMultipleIcon from 'mdi-react/AccountMultipleIcon';

import './Menu.scss';

const menuItems = [
    {
        label: 'Dashboard',
        link: '/franz-manager/dashboard',
        icon: <SpeedometerIcon/>
    },
    {
        label: 'Cluster',
        link: '/franz-manager/cluster',
        icon: <ViewParallelIcon/>
    },
    {
        label: 'Topics',
        link: '/franz-manager/topics',
        icon: <FormatListNumbersIcon/>
    },
    {
        label: 'Consumers',
        link: '/franz-manager/consumers',
        icon: <AccountMultipleIcon/>
    }
];

class Menu extends Component {
    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    constructor(props, context) {
        super(props, context);

        let currentRoute = this.context.router.route.location.pathname;
        let currentSelectedMenuItem = menuItems.find(m => m.link.split('/')[2] === currentRoute.split('/')[2]);

        if (currentRoute === '/franz-manager' || currentRoute === '/franz-manager/') { //it means we just got redirected from root
            currentSelectedMenuItem = {label: menuItems[0].label}
        }

        this.state = {
            selectedMenuItem: currentSelectedMenuItem ? currentSelectedMenuItem.label : 'unknown'
        };

        this.context.router.history.listen(location => {
            this._updateRoute(location);
        })
    }

    _updateRoute(location){
        this.setState({selectedMenuItem: menuItems.find(m => m.link.split('/')[2] === location.pathname.split('/')[2]).label})
    }

    _selectMenuItem(menuItem) {
        this.context.router.history.push(menuItem.link);
        this.setState({selectedMenuItem: menuItem.label});
    }

    _calcIndicatorPosition() {
        let menuItemIndex = menuItems.findIndex(m => m.label === this.state.selectedMenuItem);
        return menuItemIndex * 142 + 31;
    }

    render() {
        return (
            <div className="menu box">
                <div className="menu-items">
                    {
                        menuItems.map((menuItem, index) => {
                            return (
                                <div onClick={this._selectMenuItem.bind(this, menuItem)}
                                     key={index}
                                     className={Classnames("menu-item", {selected: menuItem.label === this.state.selectedMenuItem})}>
                                    <div className="menu-item-icon">{menuItem.icon}</div>
                                    <span className="menu-item-label">{menuItem.label}</span>
                                </div>
                            )
                        })
                    }
                </div>
                <div className="menu-indicator"
                     style={{top: this._calcIndicatorPosition()}}/>
            </div>
        );
    }
}

export default Menu;