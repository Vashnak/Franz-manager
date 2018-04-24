import React from 'react';
import {Link} from 'react-router-dom';
import TopicsService from '../../../services/TopicsService';
import classNames from 'classnames';
import JSONPretty from 'react-json-pretty';
import Scrollbar from 'react-custom-scrollbars';
import CloseIcon from "mdi-react/CloseIcon";
import CheckIcon from "mdi-react/CheckIcon";

import Loader from '../../../components/loader/Loader';

import './Topic.scss';
import ConsumersService from "../../../services/ConsumersService";

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
            lastMessages: [],
            deleteTopicButtons: false,
            consumers: [],
            metrics: {},
            scientistNotation: true
        }
    }

    componentWillMount() {
        this._loadTopicDetails(this.state.topicId);
        this._loadTopicLastMessages(this.state.topicId);
        this._loadTopicPartitions(this.state.topicId);
        this._loadTopicConsumers(this.state.topicId);
        this._loadTopicMetrics(this.state.topicId);
    }

    _loadTopicMetrics(topicId){
        const wantedMetrics = ['MessagesInPerSec', 'BytesInPerSec', 'BytesOutPerSec'];
        Promise.all(wantedMetrics.map(metricName => TopicsService.getTopicMetrics(topicId, metricName)))
            .then(metricsArray => {
                const metrics = metricsArray.reduce((prev, next) => {
                    prev[next.name] = next.metrics;
                    return prev;
                }, {});
                this.setState({metrics, loadingMetrics: false});

            })
            .catch(console.error);
    }

    _loadTopicDetails(topicId){
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
            .catch(console.error);
    }

    _loadTopicConsumers(topicId){
        ConsumersService.getConsumers(null, topicId)
            .then(consumers => {
                this.setState({
                    loadingConsumers: false,
                    consumers: consumers.map(c => c.group).filter((v, i, a) => a.indexOf(v) === i)
                });
            });
    }

    _loadTopicLastMessages(topicId){
        TopicsService.getLastTopicMessage(topicId)
            .then(lastTopicMessages => {
                this.setState({loadingMessage: false, lastMessages: lastTopicMessages});
            })
            .catch((e) => {
                console.log(e);
                this.setState({
                    loadingMessage: false,
                    lastMessages: []
                })
            });
    }

    _loadTopicPartitions(topicId){
        TopicsService.getTopicPartitions(topicId)
            .then(partitions => {
                this.setState({partitions, loadingPartition: false})
            })
            .catch(console.error);
    }

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

    _toggleScientistNotation(notation) {
        this.setState({
            scientistNotation: notation === 'scientist'
        })
    }

    _formatNotation(number) {
        return this.state.scientistNotation ? number.toExponential(2) : number.toFixed(2);
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
                    <div className="topic-metrics box">
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
                                    ["MessagesInPerSec", "BytesInPerSec", "BytesOutPerSec"].map((key, index) => {
                                        return (<tr>
                                            <td>{["Messages in / sec", "Bytes in / sec", "Bytes out / sec"][index]}</td>
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

                    <div className="topic-consumers box">
                        <span className="title">Consumers <span
                            className="topic-consumers-length">{this.state.consumers.length + ' consumer' + (this.state.consumers.length > 1 ? 's' : '')}</span></span>
                        {this.state.loadingConsumers ? <Loader/> :
                            <div className="consumers-items collection">
                                {this.state.consumers.length > 0 ? this.state.consumers.map((consumer, index) => {
                                    return (
                                        <div className="consumer-item collection-item" key={consumer + "-" + index}>
                                            <Link
                                                to={`/franz-manager/consumers/${consumer.replace(/\./g, ',')}`}>{consumer}</Link>
                                        </div>
                                    )
                                }) : <div className="no-consumers">No consumers.</div>}
                            </div>
                        }
                    </div>

                    <div className="topic-settings box">
                        <span className="title">Settings</span>
                        {this.state.loadingConfiguration ? <Loader/> :
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
                        }
                    </div>
                </div>


                <div className="right-box">
                    <div className="topic-partitions box">
                        <span className="title">Partitions <span
                            className="topic-partitions-length">{this.state.partitions.length + ' partition' + (this.state.partitions.length > 1 ? 's' : '')}</span></span>
                        {this.state.loadingPartition ? <Loader/> :
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
                                            return <tr>
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
                        }
                    </div>

                    <div className="topic-preview box">
                        <span className="title">Last messages</span>
                        {this.state.loadingMessage ? <Loader/>
                            : (
                                <Scrollbar>
                                    {this.state.lastMessages.length > 0 ? this.state.lastMessages.map((message, index) => {
                                        return (
                                            <div className="topic-preview-item" key={message + "-" + index}>
                                            <span
                                                className="topic-preview-key"><b>key:</b> {message.key || "null"}</span><br/>
                                                <span className="topic-preview-value"><b>value:</b></span><br/>
                                                <JSONPretty className="json-pretty" json={message.message}/>
                                            </div>
                                        )
                                    }) : (
                                        <div className="topic-preview-item">
                                            <span>No preview available for this topic.</span>
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
                </div>
            </div>
        );
    }
}

export default Topic;