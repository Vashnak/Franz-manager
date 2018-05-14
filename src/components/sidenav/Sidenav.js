import React, {Component} from 'react';
import Classnames from 'classnames';
import PropTypes from 'prop-types';

import SpeedometerIcon from 'mdi-react/SpeedometerIcon';
import ViewParallelIcon from 'mdi-react/ViewParallelIcon';
import FormatListNumbersIcon from 'mdi-react/FormatListNumbersIcon';
import AccountMultipleIcon from 'mdi-react/AccountMultipleIcon';

import './Sidenav.scss';

const sidenavItems = [
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

class Sidenav extends Component {
    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    constructor(props, context) {
        super(props, context);

        let currentRoute = this.context.router.route.location.pathname;
        let currentSelectedSidenavItem = sidenavItems.find(m => m.link.split('/')[2] === currentRoute.split('/')[2]);

        if (currentRoute === '/franz-manager' || currentRoute === '/franz-manager/') { //it means we just got redirected from root
            currentSelectedSidenavItem = {label: sidenavItems[0].label}
        }

        this.state = {
            selectedSidenavItem: currentSelectedSidenavItem ? currentSelectedSidenavItem.label : 'unknown'
        };

        this.context.router.history.listen(location => {
            this._updateRoute(location);
        })
    }

    _updateRoute(location){
        this.setState({selectedSidenavItem: sidenavItems.find(m => m.link.split('/')[2] === location.pathname.split('/')[2]).label})
    }

    _selectSidenavItem(sidenavItem) {
        this.context.router.history.push(sidenavItem.link);
        this.setState({selectedSidenavItem: sidenavItem.label});
    }

    _calcIndicatorPosition() {
        let sidenavItemIndex = sidenavItems.findIndex(m => m.label === this.state.selectedSidenavItem);
        return sidenavItemIndex * 142 + 31;
    }

    render() {
        return (
            <div className="sidenav box">
                <div className="sidenav-items">
                    {
                        sidenavItems.map((sidenavItem, index) => {
                            return (
                                <div onClick={this._selectSidenavItem.bind(this, sidenavItem)}
                                     key={index}
                                     className={Classnames("sidenav-item", {selected: sidenavItem.label === this.state.selectedSidenavItem})}>
                                    <div className="sidenav-item-icon">{sidenavItem.icon}</div>
                                    <span className="sidenav-item-label">{sidenavItem.label}</span>
                                </div>
                            )
                        })
                    }
                </div>
                <div className="sidenav-indicator"
                     style={{top: this._calcIndicatorPosition()}}/>
            </div>
        );
    }
}

export default Sidenav;