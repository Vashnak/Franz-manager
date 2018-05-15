import React from 'react';
import {Link} from 'react-router-dom';
import TopicsService from '../../../services/TopicsService';
import classNames from 'classnames';
import JSONPretty from 'react-json-pretty';
import ConsumersService from "../../../services/ConsumersService";
import ConstantsService from "../../../services/ConstantsService";
import Scrollbar from 'react-custom-scrollbars';
import _ from "lodash";
import moment from "moment";

import Menu from '../../../shared/Menu';
import Item from '../../../shared/Menu/Item';
import Divider from '../../../shared/Menu/Divider';

import Loader from '../../../components/loader/Loader';
import Error from '../../../components/error/Error';
import Metrics from '../../../components/metrics/Metrics';

import './Topic.scss';

class Topic extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            topicId: this.props.match.params.topicId.replace(/,/g, '.'),
            topicConfiguration: {
                messages: {},
                retention: {},
                replication: {},
                segment: {},
                others: {}
            },
            partitions: [],
            loadingMessage: true,
            loadingConfiguration: true,
            loadingConsumers: true,
            loadingMetrics: true,
            loadingPartition: true,
            errorLoadingMetrics: false,
            errorLoadingConsumers: false,
            errorLoadingConfiguration: false,
            errorLoadingPartitions: false,
            errorLoadingMessages: false,
            lastMessages: [],
            maxMessagesToShow: 30,
            deleteTopicButtons: false,
            consumers: [],
            metrics: {},
            scientistNotation: true,
            selectedFilter: ''
        }
    }

    componentWillMount() {
        this._loadTopicDetails(this.state.topicId);
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

    _loadTopicDetails(topicId) {
        TopicsService.getTopicDetails(topicId)
            .then(td => {
                let configurations = td.configurations;
                let topicConfiguration = this.state.topicConfiguration;
                topicConfiguration.replication.replication = td.replication;
                topicConfiguration.others.partitions = td.partitions;

                Object.keys(configurations).forEach(key => {
                    if (key.indexOf('message') >= 0) {
                        topicConfiguration.messages[key] = configurations[key];
                    } else if (key.indexOf('retention') >= 0) {
                        topicConfiguration.retention[key] = configurations[key];
                    } else if (key.indexOf('replica') >= 0) {
                        topicConfiguration.replication[key] = configurations[key];
                    } else if (key.indexOf('segment') >= 0) {
                        topicConfiguration.segment[key] = configurations[key];
                    } else {
                        topicConfiguration.others[key] = configurations[key];
                    }
                });

                this.setState({topicConfiguration, loadingConfiguration: false})
            })
            .catch(() => {
                this.setState({loadingConfiguration: false, errorLoadingConfiguration: true})
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

    _startLiveMessages(topicId) {
        this.setState({
            loadingMessage: true,
            lastMessages: [],
            selectedFilter: "live"
        });
        this.socketSubscription = new WebSocket(ConstantsService.apis.franzManagerApi.webSocketUrl);

        this.socketSubscription.onopen = () => {
            this.socketSubscription.send("subscribe:" + topicId);
        };

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

    _loadTopicPartitions(topicId) {
        TopicsService.getTopicPartitions(topicId)
            .then(partitions => {
                this.setState({partitions, loadingPartition: false})
            })
            .catch(() => {
                this.setState({loadingPartition: false, errorLoadingPartitions: true})
            });
    }

    /** functions */
    _getValueType(value) {
        if (value === 'true' || value === 'boolean')
            return 'boolean';
        if (+value === parseInt(value) || +value === parseFloat(value))
            return 'number';
        if (value === "" || value === undefined || value === null)
            return 'null';
        return 'string';
    }

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

    _messageScrollHandler(e) {
        if (e.top > 0.9) {
            this.setState({maxMessagesToShow: this.state.maxMessagesToShow + 20})
        }
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
                            label: 'Metric',
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
                        <Scrollbar>
                            <div className="consumers-items collection">
                                {this.state.consumers.length > 0 ? this.state.consumers.map((consumer, index) => {
                                    return (
                                        <div className="consumer-item collection-item"
                                             key={consumer + "-" + index}>
                                            <Link
                                                to={`/franz-manager/consumers/${consumer.replace(/\./g, ',')}`}>{consumer}</Link>
                                        </div>
                                    )
                                }) : <div className="no-consumers">No consumers.</div>}
                            </div>
                        </Scrollbar>
                    )
                }
            </div>
        )
    }

    _renderSettings() {
        return (
            <div className="topic-settings box">
                <span className="title">Settings</span>
                {this.state.loadingConfiguration ? <Loader/> :
                    this.state.errorLoadingConfiguration ? <Error error="Cannot load settings."/> : (
                        <Scrollbar>
                            {
                                Object.keys(this.state.topicConfiguration).map((configurationGroupKey, i) => {
                                    return (
                                        <div className="topic-details-configurationGroup"
                                             key={configurationGroupKey + '-' + i}>
                                            <h5 className="topic-details-configurationGroup-title">{configurationGroupKey}</h5>
                                            {
                                                Object.keys(this.state.topicConfiguration[configurationGroupKey]).sort((a, b) => a < b ? -1 : 1).map((configurationKey, j) => {
                                                    return (
                                                        <div className="topic-details-configuration"
                                                             key={configurationKey + '-' + j}>
                                                        <span
                                                            className="topic-details-configuration-key">{configurationKey}:</span>
                                                            <span
                                                                className={classNames('topic-details-configuration-value', this._getValueType(this.state.topicConfiguration[configurationGroupKey][configurationKey]))}>
                                                        {this.state.topicConfiguration[configurationGroupKey][configurationKey] || "null"}
                                                    </span>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    )
                                })
                            }
                        </Scrollbar>
                    )
                }
            </div>
        )
    }

    _renderPartitions() {
        return (
            <div className="topic-partitions box">
                        <span className="title">Partitions <span
                            className="topic-partitions-length">{this.state.partitions.length + ' partition' + (this.state.partitions.length > 1 ? 's' : '')}</span></span>
                {this.state.loadingPartition ? <Loader/> :
                    this.state.errorLoadingPartitions ? <Error error="Cannot load partitions."/> : (
                        <Scrollbar>
                            <table>
                                <thead>
                                <tr>
                                    <th>partition</th>
                                    <th>leader</th>
                                    <th>beginning offset</th>
                                    <th>end offset</th>
                                    <th>replicas</th>
                                    <th>in sync replicas</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.partitions.sort((a, b) => a.partition - b.partition).map(partition => {
                                        return <tr
                                            className={classNames({notSync: !this._isPartitionSync(partition)})}>
                                            <td>{partition.partition}</td>
                                            <td>{partition.leader}</td>
                                            <td>{partition.beginningOffset}</td>
                                            <td>{partition.endOffset}</td>
                                            <td>({partition.replicas.join(', ')})</td>
                                            <td>({partition.inSyncReplicas.join(', ')})</td>
                                        </tr>
                                    })
                                }
                                </tbody>
                            </table>
                        </Scrollbar>
                    )
                }
            </div>
        )
    }

    _renderLastMessages() {
        const messages = _.clone(this.state.lastMessages);

        return (
            <div className="topic-preview box">
                        <span className="title">Last messages <span
                            className="topic-messages-length">{this.state.lastMessages.length + ' message' + (this.state.lastMessages.length > 1 ? 's' : '')}</span>
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
                        <Scrollbar onScrollFrame={this._messageScrollHandler.bind(this)}>
                            {messages.length > 0 ? messages.splice(0, this.state.maxMessagesToShow).map((message, index) => {
                                return (
                                    <div className="topic-preview-item" key={message + "-" + index}>
                                                <span
                                                    className="topic-preview-timestamp"><b>timestamp:</b> {message.timestamp === -1 ? 'unknown' : new Date(message.timestamp).toISOString()}</span><br/>
                                        <span
                                            className="topic-preview-key"><b>key:</b> {message.key || "null"}</span><br/>
                                        <span className="topic-preview-value"><b>value:</b></span><br/>
                                        <JSONPretty className="json-pretty" json={message.message}/>
                                    </div>
                                )
                            }) : (
                                <div className="topic-preview-item">
                                    <span>No message for this topic with these filters.</span>
                                </div>
                            )}
                        </Scrollbar>
                    )
                }
                {this.state.deleteTopicButtons ?
                    <span className="confirm-delete-box">
                            <a className="waves-effect waves-light btn confirm-delete-topic"
                               onClick={this._deleteTopic.bind(this)}>
                                Confirm
                            </a>
                            <a className="waves-effect waves-light btn cancel-delete-topic"
                               onClick={this._closeDeleteTopicsButtons.bind(this)}>
                                Cancel
                            </a>
                        </span> :
                    <a className="waves-effect waves-light btn delete-topic-button"
                       onClick={this._openDeleteTopicsButtons.bind(this)}>
                        Delete topic
                    </a>
                }
            </div>
        )
    }

    render() {
        return (
            <div className="topic view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/topics">Topics</Link></span>
                    <span className="breadcrumb"><Link
                        to={'/franz-manager/topics/' + this.state.topicId.replace(/\./g, ',')}>{this.state.topicId}</Link></span>
                </div>

                <div className="left-box">
                    {this._renderMetrics()}
                    {this._renderConsumers()}
                    {this._renderSettings()}
                </div>

                <div className="right-box">
                    {this._renderPartitions()}
                    {this._renderLastMessages()}
                </div>
            </div>
        );
    }
}

export default Topic;