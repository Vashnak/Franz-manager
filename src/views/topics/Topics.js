import React from 'react';
import Loader from '../../components/loader/Loader';
import Error from '../../components/error/Error';
import Metrics from '../../components/metrics/Metrics';
import TopicsService from '../../services/TopicsService';

import CustomersService from '../../services/CustomersService';
import AppsService from '../../services/AppsService';
import querystring from 'querystring';
import Scrollbar from 'react-custom-scrollbars';
import CloseIcon from "mdi-react/CloseIcon";
import CheckIcon from "mdi-react/CheckIcon";
import {Link} from 'react-router-dom';
import classNames from 'classnames';
import _ from 'lodash';

import FolderIcon from 'mdi-react/FolderIcon';
import './Topics.scss';

class Topics extends React.Component {
    constructor(props) {
        super(props);

        const queryParams = this._decodeQueryParams(this.props.location.search.substring(1));

        this.state = {
            topics: [],
            loadingTopics: true,
            errorLoadingTopics: false,
            maxShownTopics: 40,
            topicsFilters: queryParams,
            addTopicModal: false,
            customers: [],
            apps: []
        }
    }

    componentWillReceiveProps(props) {
        if (props.location.search !== this.props.location.search) {
            const queryParams = this._decodeQueryParams(props.location.search.substring(1));
            this.setState({topicsFilters: queryParams});
        }
    }

    componentWillMount() {
        if(!this.props.location.search.includes('treeView') && localStorage.getItem('treeView') === 'true'){
            let currentTopicsFilters = _.clone(this.state.topicsFilters);
            currentTopicsFilters.treeView = true;
            this.props.history.push("?" + querystring.encode(currentTopicsFilters));
            this.setState({topicsFilters: currentTopicsFilters});
        }

        TopicsService.getTopics()
            .then(topics => {
                this.setState({topics, loadingTopics: false});
            })
            .catch(() => {
                this.setState({loadingTopics: false, errorLoadingTopics: true})
            });
        CustomersService.getCustomers()
            .then(customers => {
                this.setState({customers: customers.map(c => c.customer).concat(['Common', 'PROD'])});
            });
        AppsService.getApps()
            .then(apps => {
                this.setState({apps: apps.map(a => a.codename)});
            });
    }

    _decodeQueryParams(params) {
        let queryParams = querystring.decode(params);

        queryParams.topicName = queryParams.topicName || '';
        queryParams.filterByRegexp = queryParams.filterByRegexp === 'true';
        queryParams.treeView = queryParams.treeView === 'true';
        queryParams.hideLogsTopics = queryParams.hideLogsTopics === 'true';
        queryParams.caseSensitive = queryParams.caseSensitive === 'true';

        return queryParams;
    }

    _updateFilter(inputType, filterKey, e) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);
        switch (inputType) {
            case 'checkbox':
                if(filterKey === 'treeView'){
                    localStorage.setItem('treeView', (!currentTopicsFilters[filterKey]).toString());
                }
                currentTopicsFilters[filterKey] = !currentTopicsFilters[filterKey];
                break;
            case 'text':
                currentTopicsFilters[filterKey] = e.target.value;
                break;
        }
        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters})
    }

    _onTopicListScrolled(e) {
        if (e.top > 0.9) {
            this.setState({maxShownTopics: this.state.maxShownTopics + 20})
        }
    }

    _filterTopics(topics) {
        const filters = this.state.topicsFilters;
        let regexp;

        if (filters.filterByRegexp) {
            try {
                regexp = new RegExp(filters.topicName || ".*");
                if (!this.state.isRegexpWellFormatted) {
                    this.setState({isRegexpWellFormatted: true});
                }
            } catch (e) {
                if (this.state.isRegexpWellFormatted) {
                    this.setState({isRegexpWellFormatted: false});
                }
                return [];
            }
        }

        return topics.filter(topic => {
            let topicNameFilter = true;

            if (filters.filterByRegexp) topicNameFilter = regexp.test(topic.id);
            else if (filters.caseSensitive) topicNameFilter = topic.id.indexOf(filters.topicName) >= 0;
            else topicNameFilter = topic.id.toLowerCase().indexOf(filters.topicName.toLowerCase()) >= 0;

            const showLogs = filters.hideLogsTopics ? topic.id.substr(topic.id.length - 4, 4) !== '.log' : true;
            return topicNameFilter && showLogs;
        }).sort((a, b) => {
            return a.id < b.id ? -1 : 1;
        });
    }

    _handleCustomerClick(customer) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);
        currentTopicsFilters.customer = customer;
        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters})
    }

    _handleCodenameClick(codename) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);
        currentTopicsFilters.codename = codename;
        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters})
    }

    _handleBackClick(lastState) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);
        if (lastState === 'customer') {
            currentTopicsFilters.customer = '';
        }
        if (lastState === 'codename') {
            currentTopicsFilters.codename = '';
        }
        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters});
    }

    _renderTreeView(topics) {
        if (this.state.topicsFilters.customer && this.state.topicsFilters.codename) {
            return (
                <div className="topics-tree-view">
                    <li className="topics-item collection-item"
                        onClick={this._handleBackClick.bind(this, 'codename')}>
                        <FolderIcon/> ..
                    </li>
                    {
                        topics.filter(topic => {
                            let splittedTopic = topic.id.split('.');
                            return this.state.topicsFilters.customer === splittedTopic[0] && this.state.topicsFilters.codename === splittedTopic[1];
                        })
                            .sort((a, b) => a.id < b.id ? -1 : 1)
                            .map(topic => {
                                return (
                                    <li className="topics-item collection-item invalid-codename-topic">
                                        <Link
                                            to={'/franz-manager/topics/' + topic.id.replace(/\./g, ',')}>{topic.id}</Link>
                                    </li>
                                )
                            })
                    }
                </div>
            )
        }
        if (this.state.topicsFilters.customer) {
            let invalidCodenameTopic = [];
            let validCodenameTopic = [];

            topics.forEach(topic => {
                let customer = topic.id.split('.')[0];
                if (customer === this.state.topicsFilters.customer) {
                    let codename = topic.id.split('.')[1];
                    if (codename && this.state.apps.includes(codename)) {
                        validCodenameTopic.push(topic);
                    } else {
                        invalidCodenameTopic.push(topic);
                    }
                }
            });

            return (
                <div className="topics-tree-view">
                    <li className="topics-item collection-item"
                        onClick={this._handleBackClick.bind(this, 'customer')}>
                        <FolderIcon/> ..
                    </li>
                    {
                        [...new Set(validCodenameTopic.map(topic => topic.id.split('.')[1]))]
                            .sort((a, b) => a < b ? -1 : 1)
                            .map(codename => {
                                return (
                                    <li className="topics-item collection-item"
                                        onClick={this._handleCodenameClick.bind(this, codename)}>
                                        <FolderIcon/> {codename}
                                    </li>
                                )
                            })
                    }
                    {
                        invalidCodenameTopic.sort((a, b) => a.id < b.id ? -1 : 1).map(topic => {
                            return (
                                <li className="topics-item collection-item invalid-codename-topic">
                                    <Link
                                        to={'/franz-manager/topics/' + topic.id.replace(/\./g, ',')}>{topic.id}</Link>
                                </li>
                            )
                        })
                    }
                </div>
            )
        } else {
            let invalidCustomerTopic = [];
            let validCustomerTopics = [];

            topics.forEach(topic => {
                let customer = topic.id.split('.')[0];
                if (this.state.customers.includes(customer)) {
                    validCustomerTopics.push(topic);
                } else {
                    invalidCustomerTopic.push(topic);
                }
            });

            return (
                <div className="topics-tree-view">
                    {
                        [...new Set(validCustomerTopics.map(topic => topic.id.split('.')[0]))]
                            .sort((a, b) => a < b ? -1 : 1)
                            .map(customer => {
                                return (
                                    <li className="topics-item collection-item"
                                        onClick={this._handleCustomerClick.bind(this, customer)}>
                                        <FolderIcon/> {customer}
                                    </li>
                                )
                            })
                    }
                    {
                        invalidCustomerTopic.sort((a, b) => a.id < b.id ? -1 : 1).map(topic => {
                            return (
                                <li className="topics-item collection-item invalid-customer-topic">
                                    <Link
                                        to={'/franz-manager/topics/' + topic.id.replace(/\./g, ',')}>{topic.id}</Link>
                                </li>
                            )
                        })
                    }
                </div>
            )
        }
    }

    _handleOpenAddTopicModalClick() {
        this.setState({addTopicModal: true});
    }

    _setAddTopicName(e) {
        this.setState({addTopicModalTopicName: e.target.value});
    }

    _validAddTopicModal() {
        if (this.state.addTopicModalTopicName) {
            TopicsService
                .addTopic(this.state.addTopicModalTopicName)
                .then(() => {
                    return TopicsService.getTopicDetails(this.state.addTopicModalTopicName);
                })
                .then(topic => {
                    this.setState({topics: [topic].concat(this.state.topics)});
                    this._closeAddTopicModal();
                });
            console.log("Adding topic " + this.state.addTopicModalTopicName)
        }
    }

    _closeAddTopicModal() {
        this.setState({addTopicModal: false});
    }

    render() {
        const topicsToShow = this._filterTopics(this.state.topics).sort((a, b) => a.id < b.id ? -1 : 1);

        return (
            <div className="topics view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/topics">Topics</Link></span>
                </div>
                <div className="left-box">
                    <div className="topics-filters box">
                        <span className="title">Filters</span>

                        <div className="row">
                            <div className="topics-filters-name input-field">
                                <input type="text"
                                       placeholder=".*"
                                       className={classNames({'bad-formatted-regexp-input': this.state.topicsFilters.filterByRegexp && !this.state.isRegexpWellFormatted})}
                                       onChange={this._updateFilter.bind(this, 'text', 'topicName')}
                                       value={this.state.topicsFilters.topicName}/>
                                <label className="active">Topic name</label>
                                {this.state.topicsFilters.filterByRegexp && !this.state.isRegexpWellFormatted && (
                                    <span className="bad-formatted-regexp-message">Bad regexp format</span>)}
                            </div>
                            <div className="topics-filters-regexp"
                                 onClick={this._updateFilter.bind(this, 'checkbox', 'filterByRegexp')}>
                                <input type="checkbox" className="filled-in"
                                       checked={this.state.topicsFilters.filterByRegexp}/>
                                <label>is regexp ?</label>
                            </div>
                        </div>

                        <div className="row">
                            <div className="topics-filters-case-sensitive switch">
                                <label>
                                    <input type="checkbox" checked={this.state.topicsFilters.caseSensitive}
                                           onClick={this._updateFilter.bind(this, 'checkbox', 'caseSensitive')}/>
                                    <span className="lever"/>
                                    <label>Case sensitive</label>
                                </label>
                            </div>
                        </div>

                        <div className="row">
                            <div className="topics-filters-logs-view switch">
                                <label>
                                    <input type="checkbox" checked={this.state.topicsFilters.hideLogsTopics}
                                           onClick={this._updateFilter.bind(this, 'checkbox', 'hideLogsTopics')}/>
                                    <span className="topics-filters-tree-view-switch lever"/>
                                    <label>Hide log topics</label>
                                </label>
                            </div>
                        </div>

                        <div className="row">
                            <div className="topics-filters-tree-view switch">
                                <label>
                                    <input type="checkbox" checked={this.state.topicsFilters.treeView}
                                           onClick={this._updateFilter.bind(this, 'checkbox', 'treeView')}/>
                                    <span className="topics-filters-tree-view-switch lever"/>
                                    <label>Enable tree view</label>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="topics-items collection box">
                    <span className="title">Topics <span
                        className="topics-items-length">{topicsToShow.length + ' topic' + (topicsToShow.length > 1 ? 's' : '')}</span></span>
                    {
                        this.state.loadingTopics ? <Loader/> : (
                            this.state.errorLoadingTopics ? <Error error="Cannot load topics."/> : (
                                <Scrollbar onScrollFrame={this._onTopicListScrolled.bind(this)}>
                                    {
                                        this.state.topicsFilters.treeView ? (
                                            this._renderTreeView(topicsToShow)
                                        ) : (
                                            <div className="topics-classic-view">
                                                {
                                                    topicsToShow.splice(0, this.state.maxShownTopics).map(topic => {
                                                        return (
                                                            <li className="topics-item collection-item">
                                                                <Link
                                                                    to={'/franz-manager/topics/' + topic.id.replace(/\./g, ',')}>{topic.id}</Link>
                                                            </li>
                                                        )
                                                    })
                                                }
                                            </div>
                                        )
                                    }
                                </Scrollbar>
                            )
                        )}
                    <div className="topics-add-topic">
                        <a className="waves-effect waves-light btn"
                           onClick={this._handleOpenAddTopicModalClick.bind(this)}>Add topic</a>
                    </div>
                </div>
                {this.state.addTopicModal && (
                    <div className="topics-add-topic-modal">
                        <div className="content">
                            <div className="input-field">
                                <input type="text"
                                       placeholder="my-super-topic"
                                       className="topics-add-topic-modal-input"
                                       onChange={this._setAddTopicName.bind(this)}
                                       value={this.state.addTopicModalTopicName}/>
                                <label className="active">Topic name</label>
                            </div>
                            <div className="icons">
                                <span className="check"
                                      onClick={this._validAddTopicModal.bind(this)}><CheckIcon/></span>
                                <span className="close"
                                      onClick={this._closeAddTopicModal.bind(this)}><CloseIcon/></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default Topics;