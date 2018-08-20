import React, {Component} from 'react';
import TopicsService from '../../../services/TopicsService';
import ConsumersService from '../../../services/ConsumersService';
import PerfectScrollbar from 'react-perfect-scrollbar';
import JSONPretty from 'react-json-pretty';
import moment from 'moment';

import Ink from 'react-ink';
import Loader from '../../../components/loader/Loader';
import Menu from '../../../components/menu/Menu';
import Option from '../../../components/menu/option/Option';

import Error from "../../../components/error/Error";
import SettingsModal from "./settingsModal/SettingsModal";

const partitionColors = [
    '#e57373',
    '#f06292',
    '#ba68c8',
    '#9575cd',
    '#64b5f6',
    '#4dd0e1',
    '#81c784',
    '#dce775',
    '#ffd54f',
    '#ffb74d',
];

const messageTypes = [
    '10 last messages',
    '30 last messages',
    '100 last messages',
    'Last 5 minutes',
    'Last hour',
    'Today',
    // 'Live message'
];

class Topic extends Component {
    constructor(props) {
        super(props);

        this.state = {
            topicId: this.props.match.params.topicId,
            metrics: [],
            partitions: [],
            consumers: [],
            messages: [],
            maxShownMessages: 20,
            loadingMessages: true,
            loadingConsumers: true,
            loadingMetrics: true,
            loadingPartitions: true,
            errorLoadingMetrics: false,
            errorLoadingConsumers: false,
            errorLoadingPartitions: false,
            errorLoadingMessages: false,
            messageTypeSelected: '10 last messages'
        }
    }

    componentWillMount() {
        this._loadTopicMessages(10);
        this._loadTopicPartitions();
        this._loadTopicConsumers();
        this._loadTopicMetrics();
    }

    _changeMessageType(type) {
        this.setState({messageTypeSelected: type});
        let topicToLoad;
        let timestamp;
        switch (type) {
            case '10 last messages':
                topicToLoad = 10;
                break;
            case '30 last messages':
                topicToLoad = 30;
                break;
            case '100 last messages':
                topicToLoad = 100;
                break;
            case 'Last 5 minutes':
                timestamp = moment().subtract(5, 'm').format('x');
                break;
            case 'Last hour':
                timestamp = moment().subtract(1, 'h').format('x');
                break;
            case 'Last 24 hours':
                timestamp = moment().hour(0).minute(0).second(0).millisecond(0).format('x');
                break;
        }
        this._loadTopicMessages(topicToLoad, timestamp);
    }

    _onMessagesScroll(e) {
        if (!this.throttleScroll && this.state.maxShownMessages < this.state.messages.length && e.scrollTop !== 0) {
            this.setState({maxShownMessages: this.state.maxShownMessages + 20});
            setTimeout(() => {
                this.throttleScroll = false;
            }, 100)
        }
    }

    _loadTopicMetrics() {
        const wantedMetrics = [
            {id: 'MessagesInPerSec', label: 'Messages in'},
            {id: 'BytesInPerSec', label: 'Bytes in'},
            {id: 'BytesOutPerSec', label: 'Bytes out'}
        ];
        Promise.all(wantedMetrics.map(metric => TopicsService.getTopicMetrics(this.state.topicId, metric.id)))
            .then(metrics => {
                this.setState({
                    metrics: metrics.map(metric => {
                        metric.label = wantedMetrics.find(w => w.id === metric.name).label;
                        return metric;
                    }),
                    loadingMetrics: false
                });

            })
            .catch(() => {
                this.setState({loadingMetrics: false, errorLoadingMetrics: true})
            });
    }

    _loadTopicPartitions() {
        TopicsService.getTopicPartitions(this.state.topicId)
            .then(partitions => {
                this.setState({partitions, loadingPartitions: false})
            })
            .catch(() => {
                this.setState({loadingPartitions: false, errorLoadingPartitions: true})
            });
    }

    _loadTopicConsumers() {
        ConsumersService.getConsumers(null, this.state.topicId)
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

    _loadTopicMessages(number, timestamp) {
        this.setState({
            loadingMessages: true,
            messages: []
        });
        TopicsService.getLastTopicMessages(this.state.topicId, number, timestamp)
            .then(messages => {
                this.setState({
                    loadingMessages: false,
                    messages: messages,
                    maxMessagesToShow: 30
                });
            })
            .catch((e) => {
                if (e === 'No message for this topic.') {
                    this.setState({
                        loadingMessages: false,
                        messages: []
                    });
                } else {
                    this.setState({
                        loadingMessages: false,
                        messages: [],
                        errorLoadingMessages: true
                    });
                }
            });
    }

    _openSettings() {
        this.setState({settingsModal: true})
    }

    _closeSettings() {
        this.setState({settingsModal: false})
    }

    _deleteTopic() {
        TopicsService.deleteTopic(this.state.topicId)
            .then(() => {
                this.props.history.goBack();
            });
    }

    _renderContextActions() {
        return <div className="context-actions topic-context-actions">
            <button onClick={this._openSettings.bind(this)} className='toggle'>
                Settings
                <Ink/>
            </button>
            {this.state.confirmDelete ? [
                    <button onClick={this._deleteTopic.bind(this)} className='toggle danger'>
                        Confirm
                        <Ink/>
                    </button>,
                    <button onClick={() => this.setState({confirmDelete: false})} className='regular'>
                        Cancel
                        <Ink/>
                    </button>
                ] :
                <button onClick={() => this.setState({confirmDelete: true})} className='toggle'>
                    Delete Topic
                    <Ink/>
                </button>
            }
        </div>;
    }

    _renderFormatDateMessage(timestamp) {
        const date = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(timestamp);

        const ms = new Date(timestamp).getMilliseconds();

        return <span className="timestamp">{date} and <span className="milliseconds"> {ms}ms</span> </span>;
    }

    _renderMetrics() {
        return <div className="metrics">
            <header>
                <h3>Brokers</h3>
            </header>
            {this.state.loadingMetrics && <Loader width="32"/>}
            {this.state.errorLoadingMetrics && !this.state.loadingMetrics && <Error noRiddle={true}/>}
            {!this.state.loadingMetrics && !this.state.errorLoadingMetrics && (
                <table>
                    <thead>
                    <tr>
                        <th className="text-left">Name (per sec)</th>
                        <th className="text-right">Last minute</th>
                        <th className="text-right">last 5 minutes</th>
                        <th className="text-right">last 15 minutes</th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.state.metrics.map(metric => {
                        return (
                            <tr key={metric.name}>
                                <td className="text-left">{metric.label}</td>
                                <td className="text-right">{metric.metrics.OneMinuteRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                <td className="text-right">{metric.metrics.FiveMinuteRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                <td className="text-right">{metric.metrics.FifteenMinuteRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            )}
        </div>;
    }

    _renderPartitions() {
        return <div className="partitions flex flex-1 flex-column">

            <header>
                <h3>Partitions</h3>
            </header>
            {this.state.loadingPartitions && <Loader width="32"/>}
            {this.state.errorLoadingPartitions && !this.state.loadingPartitions && <Error noRiddle={true}/>}
            {!this.state.loadingPartitions && !this.state.errorLoadingPartitions && (
                <PerfectScrollbar className="partition-datatable">
                    <table>
                        <thead>
                        <tr>
                            <th className="text-left">partitions</th>
                            <th className="text-right">beginning offset</th>
                            <th className="text-right">end offset</th>
                            <th className="text-right">replicas</th>
                            <th className="text-right">in sync</th>
                            <th className="text-right">leader</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.partitions.sort((a, b) => a.partition - b.partition).map(partition => {
                            const partitionColor = partitionColors[partition.partition % partitionColors.length];
                            return (
                                <tr key={partition.partition}>
                                    <td className="text-left">
                                        <div className="flex align-center">
                                            <i className="ellipse margin-right-8px ellipse-8px"
                                               style={{backgroundColor: partitionColor}}/>
                                            {partition.partition}
                                        </div>
                                    </td>
                                    <td className="text-right">{partition.beginningOffset}</td>
                                    <td className="text-right">{partition.endOffset}</td>
                                    <td className="text-right">({partition.replicas})</td>
                                    <td className="text-right">({partition.inSyncReplicas})</td>
                                    <td className="text-right">{partition.leader}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </PerfectScrollbar>
            )}
        </div>;
    }

    _renderConsumers() {
        return <div className="consumers">

            <header>
                <h3>Consumers</h3>
            </header>
            {this.state.loadingConsumers && <Loader width="32"/>}
            {this.state.errorLoadingConsumers && !this.state.loadingConsumers && <Error noRiddle={true}/>}
            {!this.state.loadingConsumers && !this.state.errorLoadingConsumers && (
                <div className="consumer-list">
                    {this.state.consumers.map(consumer => <button key={consumer}>{consumer} <Ink/></button>)}
                </div>
            )}
        </div>;
    }

    _renderMessages() {
        return <div className="flex flex-1">
            <div className="message-fetch-type-wrapper">
                {this.state.messageTypeSelected === 'Live message' && <button className="message-live-toggle">
                    <i className="mdi mdi-pause mdi-24px"/>
                    <Ink/>
                </button>}
                <Menu label={this.state.messageTypeSelected}>
                    {messageTypes.map(type => {
                        return <Option
                            onChange={this._changeMessageType.bind(this)}
                            value={type}
                            ref={type}
                            key={type}
                            selected={this.state.messageTypeSelected}>
                            {type}
                        </Option>;
                    })}
                </Menu>
            </div>


            <PerfectScrollbar className="messages-list" onYReachEnd={this._onMessagesScroll.bind(this)}>
                {this.state.loadingMessages && <Loader width="32"/>}
                {!this.state.loadingMessages && this.state.errorLoadingMessages && <Error noRiddle={true}/>}
                {!this.state.loadingMessages && !this.state.errorLoadingMessages &&

                this.state.messages.slice(0, this.state.maxShownMessages).map((message, index) => {
                    const partitionColor = partitionColors[message.partition % partitionColors.length];
                    return <section key={index}>
                        <div className="timestamp-wrapper">
                            {this._renderFormatDateMessage(message.timestamp)}
                        </div>
                        <header className="flex">
                            <div className="flex-1">
                                <span className="key-message"> {(message.key) ? message.key : 'null'}</span>
                            </div>
                            <div className="partition" style={{backgroundColor: partitionColor}}>
                                Partition {message.partition}
                            </div>
                        </header>
                        {(() => {
                            try {
                                JSON.parse(message.message);
                                return <JSONPretty json={message.message}/>
                            } catch (e) {
                                return <div className="simple-message">{message.message}</div>
                            }
                        })()}
                    </section>
                })
                }
            </PerfectScrollbar>
        </div>;
    }

    render() {
        return (
            <div className="topic-item-view grid-wrapper">
                {this._renderContextActions()}
                <div className="grid">
                    <div className="column left-column">
                        <section>{this._renderMetrics()}</section>
                        <section>{this._renderConsumers()}</section>
                        <section className="flex-1">{this._renderPartitions()}</section>
                    </div>
                    <div className="column darker">
                        {this._renderMessages()}
                    </div>
                </div>
                {this.state.settingsModal &&
                <SettingsModal topic={this.state.topicId} close={this._closeSettings.bind(this)}/>}
            </div>
        );
    }
}

export default Topic;
