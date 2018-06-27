import React from 'react';
import {Link} from 'react-router-dom';
import TopicsService from '../../../services/TopicsService';
import classNames from 'classnames';
import JSONPretty from 'react-json-pretty';
import ConsumersService from "../../../services/ConsumersService";
import ConstantsService from "../../../services/ConstantsService";
import {CancelIcon, CopyIcon, DeleteIcon, SettingsIcon, ValidIcon, WarningIcon} from "../../../services/SvgService";
import PerfectScrollbar from 'react-perfect-scrollbar';
import _ from "lodash";
import moment from "moment";
import {Portal} from "react-portal";
import CloseIcon from "mdi-react/CloseIcon";
import CheckIcon from "mdi-react/CheckIcon";
import {ToastContainer, ToastStore} from 'react-toasts';

import Menu from '../../../shared/Menu';
import Item from '../../../shared/Menu/Item';
import Divider from '../../../shared/Menu/Divider';

import Loader from '../../../components/loader/Loader';
import Error from '../../../components/error/Error';
import Metrics from '../../../components/metrics/Metrics';

import './Topic.scss';
import TopicSettingsModal from "./topicSettingsModal/TopicSettingsModal";
import ClustersService from "../../../services/ClustersService";

const palette = [
    "#42a5f5",
    "#ffa726",
    "#ec407a",
    "#9ccc65",
    "#9ccc6570",
    "#26c6da70",
    "#66bb6a40",
    "#ab47bc70",
    "#ffca2840",
    "#ffca2870",
    "#26c6da",
    "#ec407a70",
    "#42a5f570",
    "#26a69a",
    "#ef5350",
    "#ffca28",
    "#ec407a40",
    "#5c6bc0",
    "#ef535070",
    "#ab47bc40",
    "#5c6bc040",
    "#66bb6a70",
    "#ab47bc",
    "#29b6f670",
    "#ff7043",
    "#7e57c2",
    "#9ccc6540",
    "#ffa72640",
    "#26c6da40",
    "#26a69a70",
    "#ef535040",
    "#29b6f640",
    "#5c6bc070",
    "#29b6f6",
    "#7e57c240",
    "#42a5f540",
    "#ffa72670",
    "#d4e15740",
    "#7e57c270",
    "#ff704340",
    "#26a69a40",
    "#66bb6a",
    "#d4e15770",
    "#ff704370",
    "#d4e157"
];

class Topic extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            topicId: this.props.match.params.topicId.replace(/,/g, '.'),
            partitions: [],
            loadingMessage: true,
            loadingConsumers: true,
            loadingMetrics: true,
            loadingPartition: true,
            errorLoadingMetrics: false,
            errorLoadingConsumers: false,
            errorLoadingPartitions: false,
            errorLoadingMessages: false,
            lastMessages: [],
            maxMessagesToShow: 30,
            deleteTopicButtons: false,
            consumers: [],
            metrics: {},
            scientistNotation: true,
            selectedFilter: '',
            settingsModal: false
        }
    }

    componentWillMount() {
        this._loadTopicLastMessages(this.state.topicId);
        this._loadTopicPartitions(this.state.topicId);
        this._loadTopicConsumers(this.state.topicId);
        this._loadTopicMetrics(this.state.topicId);
    }

    componentWillUnmount() {
        if (this.socketSubscription && this.socketSubscription.readyState === this.socketSubscription.OPEN) {
            this.socketSubscription.send('close:null');
            this.socketSubscription.close();
        }
    }

    /** loaders */

    _loadTopicMetrics(topicId) {
        const wantedMetrics = ['MessagesInPerSec', 'BytesInPerSec', 'BytesOutPerSec'];
        Promise.all(wantedMetrics.map(metricName => TopicsService.getTopicMetrics(topicId, metricName)))
            .then(metricsArray => {
                const metrics = metricsArray.reduce((prev, next) => {
                    prev[next.name] = next.metrics;
                    return prev;
                }, {});
                this.setState({metrics, loadingMetrics: false});

            })
            .catch(() => {
                this.setState({loadingMetrics: false, errorLoadingMetrics: true})
            });
    }

    _loadTopicConsumers(topicId) {
        ConsumersService.getConsumers(null, topicId)
            .then(consumers => {
                this.setState({
                    loadingConsumers: false,
                    consumers: consumers.map(c => c.group).filter((v, i, a) => a.indexOf(v) === i)
                });
            })
            .catch(() => {
                this.setState({loadingConsumers: false, errorLoadingConsumers: true})
            });
    }

    _loadTopicLastMessages(topicId, quantity, timestamp, filterType = '10') {
        if (this.socketSubscription && this.socketSubscription.readyState === this.socketSubscription.OPEN) {
            console.log('close');
            this.socketSubscription.send('close:null');
        }
        this.setState({
            loadingMessage: true,
            lastMessages: [],
            selectedFilter: filterType
        });
        TopicsService.getLastTopicMessages(topicId, quantity, timestamp)
            .then(lastTopicMessages => {
                this.setState({
                    loadingMessage: false,
                    lastMessages: lastTopicMessages,
                    maxMessagesToShow: 30
                });
            })
            .catch((e) => {
                if (e === 'No message for this topic.') {
                    this.setState({
                        loadingMessage: false,
                        lastMessages: []
                    });
                } else {
                    this.setState({
                        loadingMessage: false,
                        lastMessages: [],
                        errorLoadingMessages: true
                    });
                }
            });
    }

    _loadTopicPartitions(topicId) {
        TopicsService.getTopicPartitions(topicId)
            .then(partitions => {
                this.setState({partitions, loadingPartition: false})
            })
            .catch(() => {
                this.setState({loadingPartition: false, errorLoadingPartitions: true})
            });
    }

    _startLiveMessages(topicId) {
        this.setState({
            loadingMessage: true,
            lastMessages: [],
            selectedFilter: "live"
        });
        this.socketSubscription = new WebSocket(ConstantsService.apis.franzManagerApi.webSocketUrl);

        this.socketSubscription.onopen = () => {
            this.socketSubscription.send("subscribe:" + topicId + ":" + ClustersService.getSelectedClusterId());
        }

        this.socketSubscription.onmessage = e => {
            let currentMessages = this.state.lastMessages;
            currentMessages = JSON.parse(e.data).concat(currentMessages);
            this.setState({
                loadingMessage: false,
                lastMessages: currentMessages
            });
        };

        this.socketSubscription.onclose = this.socketSubscription.onerror = () => {
            this.socketSubscription.close();
            this.socketSubscription = null;
            this.setState({
                loadingMessage: false
            });
        };
    }

    /** functions */
    _deleteTopic() {
        TopicsService.deleteTopic(this.state.topicId)
            .then(() => {
                this.props.history.goBack();
            });
    }

    _openDeleteTopicsButtons() {
        this.setState({deleteTopicButtons: true});
    }

    _closeDeleteTopicsButtons() {
        this.setState({deleteTopicButtons: false});
    }

    _isPartitionSync(partition) {
        const replicas = _.clone(partition.replicas).sort();
        const inSyncReplicas = _.clone(partition.inSyncReplicas).sort();
        return _.isEqual(replicas, inSyncReplicas);
    }

    _messageScrollHandler() {
        if (!this.throttleScroll && this.state.maxMessagesToShow < this.state.lastMessages.length) {
            this.setState({maxMessagesToShow: this.state.maxMessagesToShow + 20})
            setTimeout(() => {
                this.throttleScroll = false;
            }, 100)
        }
    }

    _addPartition(totalPartitions) {
        if(totalPartitions > this.state.partitions.length) {
            this.setState({
                addPartitionModal: false,
                loadingPartition: true
            });
            TopicsService.addTopicPartitions(this.state.topicId, totalPartitions - this.state.partitions.length)
                .then(() => {
                    setTimeout(() => this._loadTopicPartitions(this.state.topicId), 500);
                });
        }
    }

    _copyJSON(json) {
        const textarea = document.createElement('textarea');
        textarea.value = json;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        ToastStore.success('Message content copied.')
    }

    _openSettingsModal() {
        this.setState({settingsModal: true});
    }

    _closeSettingsModal() {
        this.setState({settingsModal: false});
    }

    /** renderers */
    _renderMetrics() {
        const metricsTranslation = {
            MessagesInPerSec: 'Messages in',
            BytesInPerSec: 'Bytes in',
            BytesOutPerSec: 'Bytes out'
        };

        return (
            <div className="topic-metrics box">
                <span className="title">Metrics</span>
                {this.state.loadingMetrics || !this.state.metrics ? <Loader/> :
                    this.state.errorLoadingMetrics ? <Error error="Cannot load metrics."/> : (
                        <Metrics fields={{
                            label: 'Metric (per sec)',
                            OneMinuteRate: 'Last min',
                            FiveMinuteRate: 'Last 5 min',
                            FifteenMinuteRate: 'Last 15 min'
                        }} metrics={Object.keys(this.state.metrics).map(metricKey => {
                            return {
                                label: metricsTranslation[metricKey],
                                OneMinuteRate: this.state.metrics[metricKey].OneMinuteRate,
                                FifteenMinuteRate: this.state.metrics[metricKey].FifteenMinuteRate,
                                FiveMinuteRate: this.state.metrics[metricKey].FiveMinuteRate
                            }
                        })}/>
                    )
                }
            </div>
        )
    }

    _renderConsumers() {
        return (
            <div className="topic-consumers box">
                        <span className="title">Consumers <span
                            className="topic-consumers-length">{this.state.consumers.length + ' consumer' + (this.state.consumers.length > 1 ? 's' : '')}</span></span>
                {this.state.loadingConsumers ? <Loader/> :
                    this.state.errorLoadingConsumers ? <Error error="Cannot load consumers."/> : (
                        <PerfectScrollbar>
                            <div className="consumers-items collection">
                                {this.state.consumers.length > 0 ? this.state.consumers.map((consumer, index) => {
                                    return (
                                        <div className="consumer-item collection-item"
                                             key={consumer + "-" + index}>
                                            <Link
                                                to={`/franz-manager/consumers/${consumer}`}>{consumer}</Link>
                                        </div>
                                    )
                                }) : <div className="no-consumers">No consumers.</div>}
                            </div>
                        </PerfectScrollbar>
                    )
                }
            </div>
        )
    }

    _sortReplicas(replicas, leader) {
        let replicasCopy = _.cloneDeep(replicas);
        let result = [];
        let leaderIndex = replicasCopy.findIndex(r => r === leader);
        result.push(replicasCopy[leaderIndex]);
        replicasCopy.splice(leaderIndex, 1);
        result = result.concat(replicasCopy.sort((a, b) => b - a));
        return result;
    };

    _notPreferredReplicaMouseEnter(enabled, e) {
        if (enabled) {
            let target = e.target;
            let overlay = document.createElement('div');
            overlay.setAttribute('id', 'replicas-overlay');
            let rect = target.getBoundingClientRect();
            overlay.innerHTML = `This leader is not the preferred one.`;
            overlay.style.top = rect.top - 20;
            overlay.style.left = rect.left + 20;
            document.body.appendChild(overlay);
        }
    }

    _notPreferredReplicaMouseLeave(enabled) {
        if (enabled) {
            let overlay = document.querySelector('#replicas-overlay');
            document.body.removeChild(overlay);
        }
    }

    _renderPartitions() {
        return (
            <div className="topic-partitions box">
                        <span className="title">Partitions <span
                            className="topic-partitions-length">{this.state.partitions.length + ' partition' + (this.state.partitions.length > 1 ? 's' : '')}</span></span>
                {this.state.loadingPartition ? <Loader/> :
                    this.state.errorLoadingPartitions ? <Error error="Cannot load partitions."/> : (
                        <PerfectScrollbar className="topic-partitions-scrollbar">
                            <table>
                                <thead>
                                <tr>
                                    <th>partition</th>
                                    <th>beginning offset</th>
                                    <th>end offset</th>
                                    <th>replicas</th>
                                    <th>in sync</th>
                                    <th>leader</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.partitions.sort((a, b) => a.partition - b.partition).map(partition => {
                                        let preferredReplica = partition.replicas[0];
                                        let replicas = this._sortReplicas(partition.replicas, partition.leader);
                                        let inSyncReplicas = this._sortReplicas(partition.inSyncReplicas, partition.leader);
                                        let notPreferredPartition = preferredReplica !== partition.leader;
                                        return <tr key={partition.partition}
                                                   className={classNames({notSync: !this._isPartitionSync(partition)})}>
                                            <td>{partition.partition} <span className="color"
                                                                            style={{backgroundColor: palette[partition.partition]}}/>
                                            </td>
                                            <td>{partition.beginningOffset}</td>
                                            <td>{partition.endOffset}</td>
                                            <td>({replicas.join(', ')})</td>
                                            <td>({inSyncReplicas.join(', ')})</td>
                                            <td className={classNames("leader", {"not-preferred-leader": notPreferredPartition})}
                                                onMouseEnter={this._notPreferredReplicaMouseEnter.bind(this, notPreferredPartition)}
                                                onMouseLeave={this._notPreferredReplicaMouseLeave.bind(this, notPreferredPartition)}>
                                                {partition.leader} {notPreferredPartition && <span>*</span>}</td>
                                        </tr>
                                    })
                                }
                                </tbody>
                            </table>
                        </PerfectScrollbar>
                    )
                }

                <div className="add-partition-button" ref="add-partition-button">
                    <a className="waves-effect waves-light btn"
                       onClick={() => this.setState({addPartitionModal: true})}>Update</a>
                </div>

                {this.state.addPartitionModal && (
                    <Portal>
                        <div className="add-partitions-modal">
                            <div className="content"
                                 style={{
                                     top: this.refs['add-partition-button'].getBoundingClientRect().top - 140,
                                     left: this.refs['add-partition-button'].getBoundingClientRect().left
                                 }}>
                                <div className="input-field">
                                    <input type="text"
                                           placeholder={this.state.partitions.length}
                                           onChange={e => this.setState({partitionToAdd: e.target.value})}
                                           value={this.state.partitionToAdd}/>
                                    <label className="active">How many partition do you want ?</label>
                                    {this.state.partitionToAdd <= this.state.partitions.length && <span className="error">
                                        Please set a number greater than {this.state.partitions.length}.
                                    </span>}
                                </div>
                                <div className="icons">
                                <span className="check"
                                      onClick={this._addPartition.bind(this, this.state.partitionToAdd)}><CheckIcon/></span>
                                    <span className="close"
                                          onClick={() => this.setState({
                                              partitionToAdd: null,
                                              addPartitionModal: false
                                          })}><CloseIcon/></span>
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}
            </div>
        )
    }

    _renderLastMessages() {
        const messages = _.clone(this.state.lastMessages);
        return (
            <div className="topic-preview box">
                <textarea style={{display: 'none'}} id="toCopy"/>
                <span className="title">Last messages <span
                    className="topic-messages-length">{messages.length + ' message' + (messages.length > 1 ? 's' : '')}</span>
                    {messages.find(m => m.timestamp === -1) && <span className="warning"></span>}

                    <Menu>
                                <Item label="10 messages"
                                      onClick={this._loadTopicLastMessages.bind(this, this.state.topicId, 10, null, "10")}
                                      selected={this.state.selectedFilter === '10'}/>
                                <Item label="30 messages"
                                      onClick={this._loadTopicLastMessages.bind(this, this.state.topicId, 30, null, "30")}
                                      selected={this.state.selectedFilter === '30'}/>
                                <Item label="100 messages"
                                      onClick={this._loadTopicLastMessages.bind(this, this.state.topicId, 100, null, "100")}
                                      selected={this.state.selectedFilter === '100'}/>
                                <Divider/>
                                <Item label="5 last minutes"
                                      onClick={this._loadTopicLastMessages.bind(this, this.state.topicId, null, moment().subtract(5, 'm').format('x'), "min")}
                                      selected={this.state.selectedFilter === 'min'}/>
                                <Item label="last hour"
                                      onClick={this._loadTopicLastMessages.bind(this, this.state.topicId, null, moment().subtract(1, 'h').format('x'), "hour")}
                                      selected={this.state.selectedFilter === 'hour'}/>
                                <Item label="today"
                                      onClick={this._loadTopicLastMessages.bind(this, this.state.topicId, null, moment().hour(0).minute(0).second(0).millisecond(0).format('x'), "today")}
                                      selected={this.state.selectedFilter === 'today'}/>
                                <Divider/>
                                <Item label="live messages"
                                      onClick={this._startLiveMessages.bind(this, this.state.topicId)}
                                      selected={this.state.selectedFilter === 'live'}/>
                            </Menu>
                        </span>
                {this.state.loadingMessage ? <Loader/> :
                    this.state.errorLoadingMessages ? <Error error="Cannot load last messages."/> : (
                        <PerfectScrollbar ref="messages-scrollbar" onYReachEnd={this._messageScrollHandler.bind(this)}>
                            {messages.length > 0 ? messages.splice(0, this.state.maxMessagesToShow).map((message, index) => {
                                return (
                                    <div className="topic-preview-item" key={message + "-" + index}>
                                        <div className="top-message-container">
                                            <div className="color-bar"
                                                 style={{backgroundColor: palette[message.partition]}}/>
                                            <div className="message-info">
                                            <span className="topic-preview-timestamp">
                                            <b>timestamp:</b> {message.timestamp === -1 ? 'unknown' : new Date(message.timestamp).toISOString()}
                                                <CopyIcon className="copy-icon"
                                                          onClick={this._copyJSON.bind(this, message.message)}/>
                                            </span><br/>
                                                <span
                                                    className="topic-preview-key"><b>key:</b> {message.key || "null"}</span><br/>
                                                <span className="topic-preview-value"><b>value:</b></span><br/>
                                                {
                                                    (() => {
                                                        try {
                                                            JSON.parse(message.message);
                                                            return <JSONPretty className="json-pretty"
                                                                               json={message.message}/>;
                                                        } catch (e) {
                                                            return <pre className="json-pretty">{message.message}</pre>;
                                                            // return <span className="message">{message.message}</span>;
                                                        }
                                                    })()
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div className="topic-preview-item">
                                    <span>No message for this topic with these filters.</span>
                                </div>
                            )}
                        </PerfectScrollbar>
                    )
                }
                <ToastContainer store={ToastStore}/>
            </div>
        )
    }

    render() {
        return (
            <div className="topic view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/topics">Topics</Link></span>
                    <span className="breadcrumb"><Link
                        to={'/franz-manager/topics/' + this.state.topicId}>{this.state.topicId}</Link></span>
                    <SettingsIcon className="settings-icon" width={20} onClick={this._openSettingsModal.bind(this)}/>
                    {this.state.deleteTopicButtons ?
                        <span className="confirm-delete-box">
                            <CancelIcon className="cancel-icon" width={20} fill="red"
                                        onClick={this._closeDeleteTopicsButtons.bind(this)}/>
                            <ValidIcon className="confirm-icon" width={20} fill="green"
                                       onClick={this._deleteTopic.bind(this)}/>
                        </span> :
                        <DeleteIcon className="delete-icon" width={24}
                                    onClick={this._openDeleteTopicsButtons.bind(this)}/>
                    }
                </div>

                <div className="boxes">
                    <div className="left-box">
                        {this._renderMetrics()}
                        {this._renderConsumers()}
                        {this._renderPartitions()}
                    </div>

                    <div className="right-box">
                        {this._renderLastMessages()}
                    </div>
                </div>

                {this.state.settingsModal &&
                <TopicSettingsModal topicId={this.state.topicId} close={this._closeSettingsModal.bind(this)}/>}
            </div>
        );
    }
}

export default Topic;
