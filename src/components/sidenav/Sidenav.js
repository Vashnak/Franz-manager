import React, {Component} from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import {DashboardIcon, ClusterIcon, TopicsIcon, ConsumerIcon} from "../../services/SvgService";
import Ink from 'react-ink';
import themes from '../../assets/themes/themes';
import ThemesStore from "../../stores/ThemesStore";
import Menu from "../menu/Menu";
import Option from "../menu/option/Option";

const sidenavItems = [
    {
        label: 'Dashboard',
        link: '/franz-manager/dashboard',
        icon: <DashboardIcon/>
    },
    {
        label: 'Cluster',
        link: '/franz-manager/cluster',
        icon: <ClusterIcon/>
    },
    {
        label: 'Topics',
        link: '/franz-manager/topics',
        icon: <TopicsIcon/>
    },
    {
        label: 'Consumers',
        link: '/franz-manager/consumers',
        icon: <ConsumerIcon/>
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
            selectedSidenavItem: currentSelectedSidenavItem ? currentSelectedSidenavItem.label : 'unknown',
            selectedTheme: ThemesStore.getTheme().file
        };

        this.context.router.history.listen(location => {
            this._updateRoute(location);
        })
    }

    _updateRoute(location) {
        this.setState({selectedSidenavItem: sidenavItems.find(m => m.link.split('/')[2] === location.pathname.split('/')[2]).label})
    }

    _selectSidenavItem(sidenavItem) {
        this.context.router.history.push(sidenavItem.link);
        this.setState({selectedSidenavItem: sidenavItem.label});
    }

    _switchTheme(theme) {
        ThemesStore.updateTheme(theme);
    }

    render() {
        return (
            <div className="sidebar">
                <div className="sidenav-items">
                    {
                        sidenavItems.map((sidenavItem, index) => {
                            return (
                                <a onClick={this._selectSidenavItem.bind(this, sidenavItem)}
                                   key={index}
                                   className={classnames("sidenav-item", {selected: sidenavItem.label === this.state.selectedSidenavItem})}>
                                    {sidenavItem.icon}
                                    <span className="label">{sidenavItem.label}</span>
                                    <Ink/>
                                </a>
                            )
                        })
                    }
                </div>

                <Menu
                    className="theme-menu"
                    label={"Theme"}
                    selected={this.state.selectedTheme}
                    ref={"theme-menu"}
                    onChange={this._switchTheme.bind(this)}>

                    {themes.map(theme => {
                        return <Option
                            onChange={this._switchTheme.bind(this)}
                            value={theme}
                            ref={theme.file}
                            key={theme.file}
                            selected={this.state.selectedTheme}>
                            {theme.file.replace('theme-', '')}
                        </Option>;
                    })}

                </Menu>
            </div>
        );
    }
}

export default Sidenav;
