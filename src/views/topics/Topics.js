import React from 'react';
import Loader from '../../components/loader/Loader';
import TopicsService from '../../services/TopicsService';
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
            loadingMetrics: true,
            maxShownTopics: 40,
            topicsFilters: queryParams,
            addTopicModal: false,
            metrics: {},
            scientistNotation: true
        }
    }

    componentWillReceiveProps(props) {
        if (props.location.search !== this.props.location.search) {
            const queryParams = this._decodeQueryParams(props.location.search.substring(1));
            this.setState({topicsFilters: queryParams});
        }
    }

    componentWillMount() {
        TopicsService.getTopics()
            .then(topics => {
                this.setState({topics, loadingTopics: false});
            });
        this._loadTopicsMetrics()
    }

    _loadTopicsMetrics() {
        const wantedMetrics = ['MessagesInPerSec', 'BytesInPerSec', 'BytesOutPerSec', 'BytesRejectedPerSec', 'FailedFetchRequestsPerSec',
            'FailedProduceRequestsPerSec', 'FetchMessageConversionsPerSec', 'ProduceMessageConversionsPerSec', 'ReplicationBytesInPerSec',
            'ReplicationBytesOutPerSec', 'TotalFetchRequestsPerSec', 'TotalProduceRequestsPerSec'];
        Promise.all(wantedMetrics.map(metricName => TopicsService.getTopicMetrics(null, metricName)))
            .then(metricsArray => {
                const metrics = metricsArray.reduce((prev, next) => {
                    prev[next.name] = next.metrics;
                    return prev;
                }, {});
                this.setState({metrics, loadingMetrics: false});

            })
            .catch(console.error);
    }

    _decodeQueryParams(params) {
        let queryParams = querystring.decode(params);

        queryParams.topicName = queryParams.topicName || '';
        queryParams.filterByRegexp = queryParams.filterByRegexp === 'true';
        queryParams.treeView = queryParams.treeView === 'true';
        queryParams.hideLogsTopics = queryParams.hideLogsTopics === 'true';

        return queryParams;
    }

    _updateFilter(inputType, filterKey, e) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);
        switch (inputType) {
            case 'checkbox':
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
            const topicNameFilter = filters.filterByRegexp ? regexp.test(topic.id) : topic.id.indexOf(filters.topicName) >= 0;
            const showLogs = filters.hideLogsTopics ? topic.id.substr(topic.id.length - 4, 4) !== '.log' : true;
            return topicNameFilter && showLogs;
        }).sort((a, b) => {
            return a.id < b.id ? -1 : 1;
        });
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

    _toggleScientistNotation(notation) {
        this.setState({
            scientistNotation: notation === 'scientist'
        })
    }

    _formatNotation(number) {
        return this.state.scientistNotation ? number.toExponential(2) : number.toFixed(2);
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
                            <div className="topics-filters-logs-view switch">
                                <label>
                                    <input type="checkbox" checked={this.state.topicsFilters.hideLogsTopics}
                                           onClick={this._updateFilter.bind(this, 'checkbox', 'hideLogsTopics')}/>
                                    <span className="topics-filters-tree-view-switch lever"/>
                                    <label>Hide log topics</label>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="topics-metrics box">
                        <span className="title">Metrics
                            <span className="notation">
                                <span onClick={this._toggleScientistNotation.bind(this, 'decimal')}
                                      className={classNames({active: !this.state.scientistNotation})}>decimal</span>
                                <span onClick={this._toggleScientistNotation.bind(this, 'scientist')}
                                      className={classNames({active: this.state.scientistNotation})}>scientist</span>
                            </span>
                        </span>
                        {this.state.loadingMetrics || !this.state.metrics ? <Loader/> :
                            <table>
                                <thead>
                                <tr>
                                    <th>name</th>
                                    <th>last min</th>
                                    <th>last 15 min</th>
                                    <th>total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    ['MessagesInPerSec', 'BytesInPerSec', 'BytesOutPerSec', 'BytesRejectedPerSec', 'FailedFetchRequestsPerSec',
                                        'FailedProduceRequestsPerSec', 'FetchMessageConversionsPerSec', 'ProduceMessageConversionsPerSec', 'ReplicationBytesInPerSec',
                                        'ReplicationBytesOutPerSec', 'TotalFetchRequestsPerSec', 'TotalProduceRequestsPerSec'].map((key, index) => {
                                        return (<tr>
                                            <td>{['Messages in', 'Bytes in', 'Bytes out', 'Bytes rejected', 'Failed fetch requests', 'Failed produce requests',
                                                'Fetch message conversion', 'Produce message conversion', 'Replication bytes in', 'Replication bytes out',
                                                'Total fetch requests', 'Total produce requests'][index]} / sec
                                            </td>
                                            <td>{this._formatNotation(Number(this.state.metrics[key].OneMinuteRate))}</td>
                                            <td>{this._formatNotation(Number(this.state.metrics[key].FifteenMinuteRate))}</td>
                                            <td>{this._formatNotation(Number(this.state.metrics[key].Count))}</td>
                                        </tr>)
                                    })
                                }
                                </tbody>
                            </table>
                        }
                    </div>
                </div>

                <div className="topics-items collection box">
                    <span className="title">Topics <span
                        className="topics-items-length">{topicsToShow.length + ' topic' + (topicsToShow.length > 1 ? 's' : '')}</span></span>
                    {
                        this.state.loadingTopics ? <Loader/> : (
                            <Scrollbar onScrollFrame={this._onTopicListScrolled.bind(this)}>
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
                            </Scrollbar>
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