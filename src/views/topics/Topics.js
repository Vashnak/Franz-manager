import React from 'react';
import {withRouter} from 'react-router-dom';
import Loader from '../../components/loader/Loader';
import Error from '../../components/error/Error';
import TopicsService from '../../services/TopicsService';
import Menu from '../../shared/Menu';
import Item from '../../shared/Menu/Item';

import DeleteTopicsModal from "./deleteTopicsModal/DeleteTopicsModal";

import {ToastContainer, ToastStore} from 'react-toasts';
import querystring from 'querystring';
import PerfectScrollbar from 'react-perfect-scrollbar';
import CloseIcon from "mdi-react/CloseIcon";
import CheckIcon from "mdi-react/CheckIcon";
import {Link} from 'react-router-dom';
import classNames from 'classnames';
import _ from 'lodash';

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
            metrics: {},
            sortBy: 'id',
            reverseSort: false
        }
    }

    componentWillReceiveProps(props) {
        if (props.location.search !== this.props.location.search) {
            const queryParams = this._decodeQueryParams(props.location.search.substring(1));
            this.setState({topicsFilters: queryParams});
        }
    }

    componentWillMount() {
        this._loadTopics();
    }

    _loadTopics() {
        this.setState({loadingTopics: true});
        TopicsService.getTopics(true)
            .then(topics => {
                this.setState({topics, loadingTopics: false});
            })
            .catch(() => {
                this.setState({loadingTopics: false, errorLoadingTopics: true})
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
                currentTopicsFilters[filterKey] = !currentTopicsFilters[filterKey];
                break;
            case 'text':
                currentTopicsFilters[filterKey] = e.target.value;
                break;
        }
        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters})
    }

    _onTopicListScrolled() {
        if (!this.throttleScroll && this.state.maxShownTopics < this.state.topics.length) {
            this.setState({maxShownTopics: this.state.maxShownTopics + 20});
            setTimeout(() => {
                this.throttleScroll = false;
            }, 100)
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

        let filteredTopics = topics.filter(topic => {
            let topicNameFilter = true;

            if (filters.filterByRegexp) topicNameFilter = regexp.test(topic.id);
            else if (filters.caseSensitive) topicNameFilter = topic.id.indexOf(filters.topicName) >= 0;
            else topicNameFilter = topic.id.toLowerCase().indexOf(filters.topicName.toLowerCase()) >= 0;

            const showLogs = filters.hideLogsTopics ? topic.id.substr(topic.id.length - 4, 4) !== '.log' : true;
            return topicNameFilter && showLogs;
        }).sort((a, b) => {
            let sort = a[this.state.sortBy] < b[this.state.sortBy] ? 1 : -1;
            if (this.state.sortBy === "id") {
                sort = sort * -1;
            }
            return sort;
        });

        return this.state.reverseSort ? filteredTopics.reverse() : filteredTopics;
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
        }
    }

    _closeAddTopicModal() {
        this.setState({addTopicModal: false});
    }

    _openBulkDeleteModal(topicsToDelete) {
        this.setState({deleteTopicsModal: true, topicsToDelete});
    }

    _closeDeleteTopicsModal() {
        this.setState({
            deleteTopicsModal: false,
            topicsToDelete: []
        })
    }

    async _deleteTopics(topics) {
        let length = topics.length;
        let topicsCopy = JSON.parse(JSON.stringify(topics));
        for (const topic of topics) {
            try {
                await TopicsService.deleteTopic(topic.id);
            } catch (e) {
                console.log("could not delete topic " + topic.id);
            }
            topicsCopy.splice(topicsCopy.findIndex(t => t.id = topic.id), 1);
            this.setState({topicsToDelete: topicsCopy});
        }
        this.setState({
            deleteTopicsModal: false,
            deleteTopicsConfirmationModal: false,
            topicsToDelete: []
        });
        ToastStore.success(`Successfully deleted ${length} topic${length > 1 ? 's' : ''} !`, 5000);
        this._loadTopics();
    }

    _sortBy(field) {
        if (this.state.sortBy === field) {
            this.setState({reverseSort: !this.state.reverseSort});
        } else {
            this.setState({sortBy: field, reverseSort: false});
        }
    }

    _goToTopicView(topicId) {
        this.props.history.push('/franz-manager/topics/' + topicId);
    }

    _renderTopics(topics) {
        return (
            <table>
                <thead>
                <tr>
                    <th className={(this.state.sortBy === "id" ? "sort " : "") + (this.state.reverseSort ? "reverse" : "")}
                        onClick={this._sortBy.bind(this, "id")}>Topic
                    </th>
                    <th className={(this.state.sortBy === "partitions" ? "sort " : "") + (this.state.reverseSort ? "reverse" : "")}
                        onClick={this._sortBy.bind(this, "partitions")}>Partitions
                    </th>
                    <th className={(this.state.sortBy === "replications" ? "sort " : "") + (this.state.reverseSort ? "reverse" : "")}
                        onClick={this._sortBy.bind(this, "replications")}>Replicas
                    </th>
                </tr>
                </thead>
                <tbody>
                {
                    topics.map((topic, index) => {
                        return <tr key={index} onClick={this._goToTopicView.bind(this, topic.id)}>
                            <td>{topic.id}</td>
                            <td>{topic.partitions}</td>
                            <td>{topic.replications}</td>
                        </tr>
                    })
                }
                </tbody>
            </table>
        );
    }

    render() {
        const topicsToShow = this._filterTopics(this.state.topics);
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
                    </div>
                </div>

                <div className="topics-items collection box">
                    <span className="title">Topics <span
                        className="topics-items-length">{topicsToShow.length + ' topic' + (topicsToShow.length > 1 ? 's' : '')}</span>
                        <Menu>
                                <Item label="Delete shown topics"
                                      onClick={this._openBulkDeleteModal.bind(this, topicsToShow)}/>
                        </Menu>
                    </span>
                    {
                        this.state.loadingTopics ? <Loader/> : (
                            this.state.errorLoadingTopics ? <Error error="Cannot load topics."/> : (
                                <PerfectScrollbar onYReachEnd={this._onTopicListScrolled.bind(this)}>
                                    {this._renderTopics(topicsToShow.slice(0, this.state.maxShownTopics))}
                                    {/*<div className="topics-classic-view">
                                        {
                                            topicsToShow.slice(0, this.state.maxShownTopics).map(topic => {
                                                return (
                                                    <li className="topics-item collection-item" key={topic.id}>
                                                        <Link
                                                            to={'/franz-manager/topics/' + topic.id.replace(/\./g, ',')}>{topic.id}</Link>
                                                    </li>
                                                )
                                            })
                                        }
                                    </div>*/}
                                </PerfectScrollbar>
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
                {this.state.deleteTopicsModal && (
                    <DeleteTopicsModal topicsToDelete={this.state.topicsToDelete}
                                       closeModal={this._closeDeleteTopicsModal.bind(this)}
                                       deleteTopics={this._deleteTopics.bind(this)}/>
                )}
                <ToastContainer store={ToastStore}/>
            </div>
        );
    }
}

export default withRouter(Topics);
