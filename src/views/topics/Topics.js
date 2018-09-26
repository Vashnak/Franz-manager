import React from 'react';
import {withRouter} from 'react-router-dom';
import TopicsService from '../../services/TopicsService';
import ClustersService from '../../services/ClustersService';
import classnames from 'classnames';
import PerfectScrollbar from 'react-perfect-scrollbar';
import _ from 'lodash';
import Ink from 'react-ink';
import FolderIcon from 'mdi-react/FolderIcon';
import {ToastStore, ToastContainer} from 'react-toasts';

import Loader from "../../components/loader/Loader";
import Switch from "../../components/switch/Switch";
import Error from "../../components/error/Error";
import querystring from "querystring";
import {SubTreeIcon} from "../../services/SvgService";
import Link from "react-router-dom/es/Link";
import Filter from "../../components/filter/Filter";
import Modal from "../../components/modal/Modal";
import AddTopicModal from "./addTopicModal/AddTopicModal";
import Loadbar from "../../components/loadbar/Loadbar";

class Topics extends React.Component {
    constructor(props) {
        super(props);

        const queryParams = this._decodeQueryParams(this.props.location.search.substring(1));

        this.state = {
            topics: [],
            maxShownTopics: 200,
            loadingTopics: false,
            errorLoadingTopics: false,
            topicsFilters: queryParams,
            reverseSort: false,
            bulkDeleteModal: false
        }
    }

    componentWillMount() {
        this._loadTopics();
    }

    componentWillReceiveProps(props) {
        if (props.location.search !== this.props.location.search) {
            const queryParams = this._decodeQueryParams(props.location.search.substring(1));
            this.setState({topicsFilters: queryParams});
        }
    }

    _loadTopics() {
        this.setState({loadingTopics: true, topics: TopicsService.getStoredData("topics") || []});
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
        queryParams.folder = queryParams.folder || '';
        queryParams.filterByRegexp = queryParams.filterByRegexp === 'true';
        queryParams.treeView = queryParams.treeView === 'true';
        queryParams.hideLogsTopics = queryParams.hideLogsTopics === 'true';
        queryParams.caseSensitive = queryParams.caseSensitive === 'true';
        queryParams.sortBy = queryParams.sortBy || 'id';
        queryParams.reverseSort = queryParams.reverseSort === 'true';

        return queryParams;
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
        });

        return this.state.reverseSort ? filteredTopics.reverse() : filteredTopics;
    }

    _onTopicScroll(e) {
        if (!this.throttleScroll && this.state.maxShownTopics < this.state.topics.length && e.scrollTop !== 0) {
            this.setState({maxShownTopics: this.state.maxShownTopics + 20});
            setTimeout(() => {
                this.throttleScroll = false;
            }, 100)
        }
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

    _updateFilterComponent(e) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);
        currentTopicsFilters.filterByRegexp = e.filterByRegexp;
        currentTopicsFilters.topicName = e.filter;
        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters})
    }

    _toggleSwitch(label) {
        let topicsFilters = this.state.topicsFilters;
        topicsFilters[label] = !topicsFilters[label];
        this.props.history.push("?" + querystring.encode(topicsFilters));
        this.setState({topicsFilters});
    }

    _sortBy(by) {
        let currentTopicsFilters = _.clone(this.state.topicsFilters);

        if (currentTopicsFilters.sortBy === by) {
            currentTopicsFilters.reverseSort = !currentTopicsFilters.reverseSort;
        } else {
            currentTopicsFilters.reverseSort = false;
            currentTopicsFilters.sortBy = by;
        }

        this.props.history.push("?" + querystring.encode(currentTopicsFilters));
        this.setState({topicsFilters: currentTopicsFilters})
    }

    _navigateToFolder(folder) {
        let topicsFilters = this.state.topicsFilters;
        topicsFilters.folder = folder.id || folder;
        this.props.history.push("?" + querystring.encode(topicsFilters));
        this.setState({topicsFilters});
    }

    _renderTopics(topics) {
        let sorted = _.sortBy(topics, this.state.topicsFilters.sortBy);

        if ((this.state.topicsFilters.sortBy !== 'id' && !this.state.topicsFilters.reverseSort)
            || (this.state.topicsFilters.reverseSort && this.state.topicsFilters.sortBy === 'id')) {
            sorted = _.reverse(sorted);
        }

        return (
            <tbody>
            {sorted.slice(0, this.state.maxShownTopics).map(topic => {
                return (
                    <tr key={topic.id} className="pointer">
                        <td className="text-left"><Link to={'/franz-manager/topics/' + topic.id}>{topic.id}</Link></td>
                        <td className="text-right">
                            <Link to={'/franz-manager/topics/' + topic.id}>{topic.partitions}</Link></td>
                        <td className="text-right">
                            <Link to={'/franz-manager/topics/' + topic.id}>{topic.replications}</Link>
                        </td>
                    </tr>
                )
            })}
            </tbody>
        )
    }

    _renderTreeView(topics) {
        let folders = [];
        let finalTopics = [];
        const folderFilter = this.state.topicsFilters.folder || "";
        const folderIndex = folderFilter ? folderFilter.split('.').length + 1 : 1;
        topics.filter(topic => topic.id.indexOf(folderFilter) === 0)
            .forEach(topic => {
                let substringIndex = getSubstringIndex(topic.id, '.', folderIndex);
                let substring = topic.id.substring(0, substringIndex === -1 ? topic.id.length : substringIndex);
                if (substring.length < topic.id.length) {
                    const folderIndex = folders.findIndex(f => f.id === substring);
                    if (folderIndex === -1) {
                        folders.push({
                            id: substring,
                            topics: [topic],
                            partitions: topic.partitions,
                            replications: topic.replications,
                        });
                    } else {
                        folders[folderIndex].topics.push(topic);
                        folders[folderIndex].partitions += topic.partitions;
                        folders[folderIndex].replications += topic.replications;
                    }
                } else {
                    finalTopics.push(topic);
                }
            });

        folders = _.sortBy(folders, this.state.topicsFilters.sortBy);
        finalTopics = _.sortBy(finalTopics, this.state.topicsFilters.sortBy);

        if ((this.state.topicsFilters.sortBy !== 'id' && !this.state.topicsFilters.reverseSort)
            || (this.state.topicsFilters.reverseSort && this.state.topicsFilters.sortBy === 'id')) {
            folders = _.reverse(folders);
            finalTopics = _.reverse(finalTopics);
        }

        return (
            <tbody>
            {folderIndex > 1 &&
            <tr className="pointer"
                onClick={this._navigateToFolder.bind(this, folderFilter.substring(0, folderFilter.lastIndexOf('.')))}>
                <td className="text-left">
                    <FolderIcon width={20} className='folder-icon'/>
                    <span className="margin-left-8px">..</span>
                </td>
                <td className="text-right"/>
                <td className="text-right"/>
            </tr>}
            {folders.map(folder => {
                return (
                    <tr className="pointer" onClick={this._navigateToFolder.bind(this, folder)}>
                        <td className="text-left flex align-center">
                            <FolderIcon width={20} className='folder-icon'/>
                            <span className="margin-left-8px">{folder.id}</span>
                            <span
                                className="folder-stat">{folder.topics.length} topic{folder.topics.length > 1 && 's'}</span>
                        </td>
                        <td className="text-right">{folder.partitions}</td>
                        <td className="text-right">{folder.replications}</td>
                    </tr>
                )
            })}
            {finalTopics.map(topic => {
                return (
                    <tr className="pointer">
                        <td className="text-left flex align-center">
                            <SubTreeIcon width={20} className="subtree-icon"/>
                            <span className="margin-left-8px"><Link
                                to={'/franz-manager/topics/' + topic.id}>{topic.id}</Link></span>
                        </td>
                        <td className="text-right">
                            <Link to={'/franz-manager/topics/' + topic.id}>{topic.partitions}</Link></td>
                        <td className="text-right">
                            <Link to={'/franz-manager/topics/' + topic.id}>{topic.replications}</Link></td>
                    </tr>
                )
            })}
            </tbody>
        )
    }

    async _deleteTopics(topics) {
        if (!this.refs['input-topics-number'] || +this.refs['input-topics-number'].value !== topics.length) {
            return;
        }
        this.setState({badInput: null, deleting: true});

        let length = topics.length;
        let topicsCopy = JSON.parse(JSON.stringify(topics));
        for (const topic of topics) {
            try {
                await TopicsService.deleteTopic(topic.id);
            } catch (e) {
                ToastStore.error("could not delete topic " + topic.id);
            }
            topicsCopy.splice(topicsCopy.findIndex(t => t.id = topic.id), 1);
            this.setState({topicsToDelete: topicsCopy});
        }
        this.setState({
            deleting: false,
            bulkDeleteModal: false,
            askBulkDeleteConfirmation: false,
            topicsToDelete: []
        });
        ToastStore.success(`Successfully deleted ${length} topic${length > 1 ? 's' : ''} !`, 5000);
        this._loadTopics();
    }

    _openBulkDeleteModal(topics) {
        this.setState({bulkDeleteModal: true, topicsToDelete: topics});
    }

    _closeBulkDeleteModal() {
        this.setState({bulkDeleteModal: false, askBulkDeleteConfirmation: false, badInput: null, topicsToDelete: null});
    }

    _openAddTopicModal() {
        this.setState({
            addTopicModal: true
        });
    }

    _closeAddTopicModal() {
        this.setState({
            addTopicModal: false
        });
    }

    _renderContextActions(topics) {
        return <div className="context-actions topics-context-actions">
            <button className={classnames({active: this.state.topicsFilters.treeView}, "toggle")}
                    onClick={this._toggleSwitch.bind(this, 'treeView')}>
                Enable tree view
                <Ink/>
            </button>
            <button className={classnames({active: this.state.topicsFilters.hideLogsTopics}, "toggle")}
                    onClick={this._toggleSwitch.bind(this, 'hideLogsTopics')}>
                Hide logs topics
                <Ink/>
            </button>
            {this.state.topicsFilters.topicName && topics.length > 0 && (
                <button className="toggle danger" onClick={this._openBulkDeleteModal.bind(this, topics)}>
                    Delete all
                    <Ink/>
                </button>
            )}
        </div>;
    }

    render() {
        const topics = this._filterTopics(this.state.topics);
        const filters = this.state.topicsFilters;
        return (
            <div className="topics-view grid-wrapper">
                <Loadbar timer={TopicsService.getStoredData('topics-time')} finished={!this.state.loadingTopics}/>
                {this._renderContextActions(topics)}

                <div className="grid relative">
                    <div className="column">
                        <section className="flex-1">
                            {!this.state.loadingTopics && this.state.errorLoadingTopics && <Error/>}

                            {(!this.state.loadingTopics || this.state.topics) && !this.state.errorLoadingTopics ? ([
                                    <header className="filter flex" key="header">
                                        <h3>{topics.length} topics</h3>
                                        <Filter onChange={this._updateFilterComponent.bind(this)}
                                                value={this.state.topicsFilters.topicName}
                                                filterByRegexp={this.state.topicsFilters.filterByRegexp}
                                                className="margin-right-16px"/>
                                        <Switch className="margin-left-16px"
                                                onChange={this._toggleSwitch.bind(this, 'caseSensitive')}
                                                value={this.state.topicsFilters.caseSensitive} label="Case sensitive"/>
                                    </header>,
                                    <PerfectScrollbar className="topic-datatable" key="scrollbar"
                                                      onYReachEnd={this._onTopicScroll.bind(this)}>
                                        <table>
                                            <thead>
                                            <tr>
                                                <th className={classnames({
                                                    filtered: filters.sortBy === 'id',
                                                    reverse: filters.reverseSort
                                                }, 'text-left', 'pointer')}
                                                    onClick={this._sortBy.bind(this, 'id')}>Topic
                                                    Name
                                                </th>
                                                <th className={classnames({
                                                    filtered: filters.sortBy === 'partitions',
                                                    reverse: filters.reverseSort
                                                }, 'text-right', 'pointer')}
                                                    onClick={this._sortBy.bind(this, 'partitions')}> Partitions
                                                </th>
                                                <th className={classnames({
                                                    filtered: filters.sortBy === 'replications',
                                                    reverse: filters.reverseSort
                                                }, 'text-right', 'pointer')}
                                                    onClick={this._sortBy.bind(this, 'replications')}> Replica
                                                </th>
                                            </tr>
                                            </thead>
                                            {this.state.topicsFilters.treeView ? this._renderTreeView(topics) : this._renderTopics(topics)}
                                        </table>

                                        <button className="add-topic ellipse ellipse-56px"
                                                onClick={this._openAddTopicModal.bind(this)}>
                                            <i className="mdi mdi-plus mdi-24px"/><Ink/>
                                        </button>
                                    </PerfectScrollbar>
                                ]
                            ) : <Loader/>}
                        </section>
                    </div>
                </div>

                {this.state.bulkDeleteModal &&
                <Modal title={`You are going to delete ${topics.length} topics`}
                       close={this._closeBulkDeleteModal.bind(this)}
                       className="deleteTopicsModal">
                    <section className="delete-topic-list">
                        <PerfectScrollbar>
                            {this.state.topicsToDelete.map(topic => <div key={topic.id}
                                                                         className="item">{topic.id}</div>)}
                        </PerfectScrollbar>
                    </section>
                    <footer>
                        {this.state.askBulkDeleteConfirmation ? <div className="bulk-delete-confirmation">
                            <div>Please confirm by typing the number of topics you are <br/>
                                going to delete (you will be fired if you screw up)
                            </div>
                            <div className="flex align-center margin-top-8px">
                                <input type="text"
                                       className={classnames("input-topics-number", {
                                           "bad-input": this.state.badInput,
                                           "good-input": this.state.badInput === false
                                       })}
                                       onChange={e => this.setState({badInput: +e.target.value !== topics.length})}
                                       placeholder="How many ?"
                                       ref="input-topics-number"/>
                                <div className="actions margin-left-24px">
                                    <button className="danger"
                                            onClick={this._deleteTopics.bind(this, topics)}>
                                        Confirm
                                        <Ink/>
                                    </button>
                                    <button className="regular margin-left-8px">
                                        I keep my job
                                        <Ink/>
                                    </button>
                                </div>
                            </div>
                        </div> : <div className="flex align-center">
                            <div className="flex-1 text-right">Are you sure you want to do this ?</div>
                            <div className="actions margin-left-24px">
                                <button className="danger"
                                        onClick={() => this.setState({askBulkDeleteConfirmation: true})}>
                                    Yes
                                    <Ink/>
                                </button>
                                <button className="regular margin-left-8px"
                                        onClick={this._closeBulkDeleteModal.bind(this)}>
                                    I'm not that crazy
                                    <Ink/>
                                </button>
                            </div>
                        </div>}
                    </footer>
                </Modal>
                }

                {this.state.addTopicModal &&
                <AddTopicModal reloadTopics={this._loadTopics.bind(this)} close={this._closeAddTopicModal.bind(this)}/>
                }

                <ToastContainer store={ToastStore}/>
            </div>
        );
    }
}

function getSubstringIndex(str, substring, n) {
    let times = 0;
    let index = null;

    while (times < n && index !== -1) {
        index = str.indexOf(substring, index + 1);
        times++;
    }

    return index;
}

export default withRouter(Topics);
