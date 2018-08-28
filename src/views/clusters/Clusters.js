import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Ink from 'react-ink';
import BrokersService from "../../services/BrokersService";
import Loader from "../../components/loader/Loader";
import Error from '../../components/error/Error';
import TopicsService from "../../services/TopicsService";
import Filter from "../../components/filter/Filter";
import _ from "lodash";
import querystring from "querystring";
import MetricsService from "../../services/MetricsService";

class Clusters extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            brokers: [],
            metrics: [],
            brokersSettings: {
                ssl: {},
                transaction: {},
                offset: {},
                replica: {},
                zookeeper: {},
                sasl: {},
                log: {},
                others: {}
            },
            loadingBrokers: true,
            loadingBrokersSettings: true,
            loadingMetrics: true,
            zookeeperString: '',
            kafkaString: '',
            errorLoadingMetrics: false,
            errorLoadingBrokers: false,
            errorLoadingBrokersSettings: false,
            settingsFilter: "",
            settingsFilterByRegexp: ""
        }
    }

    componentWillMount() {
        this._loadTopicsMetrics();
        this._loadBrokers();
    }

    _loadBrokers() {
        this.setState({loadingBrokers: true});
        BrokersService.getBrokers()
            .then(brokers => {
                this.setState({brokers, loadingBrokers: false});
                this._formatBrokersSettings(brokers);
            })
            .catch(() => {
                this.setState({loadingBrokers: false, errorLoadingBrokers: true});
            });
    }

    _loadTopicsMetrics() {
        this.setState({loadingMetrics: true});

        const wantedMetrics = [
            {id: 'MessagesInPerSec', label: 'Messages in'},
            {id: 'BytesInPerSec', label: 'Bytes in'},
            {id: 'BytesOutPerSec', label: 'Bytes out'},
            {id: 'BytesRejectedPerSec', label: 'Bytes rejected'},
            {id: 'FailedFetchRequestsPerSec', label: 'Failed fetch request'},
            {id: 'FailedProduceRequestsPerSec', label: 'Failed produce request'},
            {id: 'FetchMessageConversionsPerSec', label: 'Fetch message conversion'},
            {id: 'ProduceMessageConversionsPerSec', label: 'Produce message conversion'},
            {id: 'ReplicationBytesInPerSec', label: 'Replication bytes in'},
            {id: 'ReplicationBytesOutPerSec', label: 'Replication bytes out'},
            {id: 'TotalFetchRequestsPerSec', label: 'Total fetch requests'},
            {id: 'TotalProduceRequestsPerSec', label: 'Total produce requests'},
        ];
        Promise.all(wantedMetrics.map(metric => MetricsService.getMetrics('kafka.server', 'BrokerTopicMetrics', metric.id, null)))
            .then(brokersMetrics => {
                this.setState({
                    metrics: brokersMetrics.map(brokersMetric => {
                        return brokersMetric.reduce((prev, next) => {
                            prev.label = wantedMetrics.find(w => w.id === next.name).label;
                            if (!prev.metrics) {
                                prev.metrics = next.metrics;
                            } else {
                                ["Count", "FifteenMinuteRate", "FiveMinuteRate", "MeanRate", "OneMinuteRate"].forEach(metricName => {
                                    prev.metrics[metricName] += next.metrics[metricName];
                                });
                            }
                            return prev;
                        }, {});
                    }),
                    loadingMetrics: false
                });
            })
            .catch(() => {
                this.setState({loadingMetrics: false, errorLoadingMetrics: true})
            });
    }

    _formatBrokersSettings(brokers) {
        this.setState({loadingBrokersSettings: true});
        let brokersSettings = this.state.brokersSettings;
        let configuration = brokers[0].configurations;
        this.setState({
            zookeeperString: configuration['zookeeper.connect'],
            kafkaString: brokers.map(b => b.host + ':' + b.port).join(',')
        });
        for (const configKey in configuration) {
            let found = false;
            for (const settingKey in brokersSettings) {
                if (configKey.includes(settingKey)) {
                    brokersSettings[settingKey][configKey] = configuration[configKey];
                    found = true;
                    break;
                }
            }
            if (!found) {
                brokersSettings.others[configKey] = configuration[configKey];
            }
        }
        this.setState({loadingBrokersSettings: false});
    }

    _updateFilterComponent(e) {
        this.setState({
            settingsFilterByRegexp: e.filterByRegexp,
            settingsFilter: e.filter
        });
    }

    _renderContextActions() {
        return <div className="clusters-context-actions context-actions flex">
            <div className="kafka address flex align-center">
                <span className="key">
                    kafka
                </span>
                <span className="value">
                    {this.state.kafkaString}
                </span>
                <span className="tooltip">
                    {this.state.kafkaString}
                </span>
                <button onClick={copyToClipboard.bind(null, this.state.kafkaString)}>
                    <i className="mdi mdi-content-copy"/>
                    <Ink/>
                </button>
            </div>
            <div className="zookeeper address flex align-center">
                <span className="key">
                    zookeeper
                </span>
                <span className="value">
                    {this.state.zookeeperString}
                </span>
                <span className="tooltip">
                    {this.state.zookeeperString}
                </span>
                <button onClick={copyToClipboard.bind(null, this.state.zookeeperString)}>
                    <i className="mdi mdi-content-copy"/>
                    <Ink/>
                </button>
            </div>
        </div>
    }

    _renderBrokers() {
        return <section>
            {this.state.loadingBrokers && <Loader width="32"/>}
            {this.state.errorLoadingBrokers && !this.state.loadingBrokers && <Error noRiddle={true}/>}
            {!this.state.loadingBrokers && !this.state.errorLoadingBrokers && (
                [
                    <header key="headerBroker"><h3>Brokers</h3></header>,
                    <table key="tableBroker">
                        <thead>
                        <tr>
                            <th className="text-left">Broker Id</th>
                            <th className="text-right">Host</th>
                            <th className="text-right">Port</th>
                            <th className="text-right">Bytes in</th>
                            <th className="text-right">bytes Out</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.brokers.map(broker => {
                            return (
                                <tr key={broker.id}>
                                    <td className="text-left">{broker.id}</td>
                                    <td className="text-right">{broker.host}</td>
                                    <td className="text-right">{broker.port}</td>
                                    <td className="text-right">{broker.bytesIn.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                    <td className="text-right">{broker.bytesOut.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                ]
            )}
        </section>
    }

    _renderSettings() {
        return <section className="flex-1">
            {this.state.loadingBrokersSettings && <Loader width="32"/>}
            {!this.state.loadingBrokersSettings && !this.state.errorLoadingBrokersSettings && (
                [
                    <header className="filter flex" key="header-settings">
                        <h3>Settings</h3>
                        <Filter onChange={this._updateFilterComponent.bind(this)} className="margin-left-32px"/>
                    </header>,
                    <PerfectScrollbar className="scrollbar settings-list">
                        {
                            Object.keys(this.state.brokersSettings)
                                .filter(settingsKey => {
                                    return Object.keys(this.state.brokersSettings[settingsKey]).find(settingKey => {
                                        if (this.state.settingsFilterByRegexp) {
                                            return new RegExp(this.state.settingsFilter).test(settingKey);
                                        }
                                        return settingKey.includes(this.state.settingsFilter)
                                    });
                                })
                                .map(settingsKey => {
                                    let settingsValue = this.state.brokersSettings[settingsKey];
                                    return <div className="margin-top-32px" key={settingsKey}>
                                        <header><h4>{settingsKey}</h4></header>
                                        {
                                            Object.keys(settingsValue)
                                                .filter(settingKey => {
                                                    if (this.state.settingsFilterByRegexp) {
                                                        return new RegExp(this.state.settingsFilter).test(settingKey);
                                                    }
                                                    return settingKey.includes(this.state.settingsFilter)
                                                })
                                                .map(settingKey => {
                                                    let settingValue = settingsValue[settingKey];
                                                    return <div key={settingKey}
                                                                className="flex space-between settings-item align-center">
                                                        <span className="settings-line-key">{settingKey}</span>
                                                        <span
                                                            className={"settings-line-" + getValueType(settingValue)}>{settingValue || "null"}</span>
                                                    </div>
                                                })
                                        }
                                    </div>
                                })
                        }
                    </PerfectScrollbar>
                ]
            )}
        </section>
    }

    _renderMetrics() {
        console.log(this.state.metrics)
        return <section className="flex-1">
            {this.state.loadingMetrics && <Loader width="32"/>}
            {this.state.errorLoadingMetrics && !this.state.loadingMetrics && <Error noRiddle={true}/>}

            {!this.state.loadingMetrics && !this.state.errorLoadingMetrics && (
                [
                    <header key="headerMetrics"><h3>Metrics</h3></header>,

                    <PerfectScrollbar className="scrollbar" key="scrollbar-metrics">
                        <table key="tableMetrics">
                            <thead>
                            <tr>
                                <th className="text-left">Name (per sec)</th>
                                <th className="text-right">Mean Rate</th>
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
                                        <td className="text-right">{metric.metrics.MeanRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                        <td className="text-right">{metric.metrics.OneMinuteRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                        <td className="text-right">{metric.metrics.FiveMinuteRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                        <td className="text-right">{metric.metrics.FifteenMinuteRate.toLocaleString('fr-FR', {maximumFractionDigits: 0})}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </PerfectScrollbar>
                ]
            )}
        </section>
    }

    render() {
        return (
            <div className="clusters-view grid-wrapper">
                {this._renderContextActions()}
                <div className="grid">
                    <div className="column">
                        {this._renderBrokers()}
                        {this._renderMetrics()}
                    </div>
                    <div className="column">
                        {this._renderSettings()}
                    </div>
                </div>
            </div>
        );
    }
}

function getValueType(value) {
    if (value === null) return 'null';
    else if (value.toString() === 'false' || value.toString() === 'true') return 'boolean';
    else if (isNormalInteger(value)) return 'value';
    return 'string';
}

function isNormalInteger(str) {
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
}

function copyToClipboard(str) {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

export default Clusters;
