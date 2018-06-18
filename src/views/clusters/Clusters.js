import React from 'react';
import {Link} from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import ClassNames from 'classnames';

import './Clusters.scss';

import BrokersService from "../../services/BrokersService";
import Loader from "../../components/loader/Loader";
import Error from '../../components/error/Error';
import Metrics from '../../components/metrics/Metrics';
import TopicsService from "../../services/TopicsService";

class Clusters extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loadingBrokers: true,
            brokers: [],
            brokersSettings: {},
            clusterSettings: {},
            metrics: {},
            loadingMetrics: true,
            errorLoadingMetrics: false,
            settingsFilter: ""
        }
    }

    componentWillMount() {
        BrokersService.getBrokers()
            .then(brokers => {
                let brokersSettings = {
                    ssl: {},
                    replicas: {},
                    offsets: {},
                    transactions: {},
                    zookeeper: {},
                    sasl: {},
                    logs: {},
                    others: {}
                };
                let broker = JSON.parse(JSON.stringify(brokers[0]));
                for (let key in broker.configurations) {
                    if (key.includes('ssl')) {
                        brokersSettings.ssl[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else if (key.includes('transaction')) {
                        brokersSettings.transactions[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else if (key.includes('offset')) {
                        brokersSettings.offsets[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else if (key.includes('replica')) {
                        brokersSettings.replicas[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else if (key.includes('zookeeper')) {
                        brokersSettings.zookeeper[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else if (key.includes('sasl')) {
                        brokersSettings.sasl[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else if (key.includes('log')) {
                        brokersSettings.logs[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    } else {
                        brokersSettings.others[key] = broker.configurations[key];
                        delete broker.configurations[key];
                    }
                }

                this.setState({brokers, brokersSettings, loadingBrokers: false});
            })
            .catch(() => this.setState({loadingBrokers: false, errorLoadingBrokers: true}));
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
            .catch(() => {
                this.setState({loadingMetrics: false, errorLoadingMetrics: true})
            });
    }

    _reduceValueSize(value) {
        if (typeof value === 'string' && value.length >= 30) {
            return value.substr(0, 30) + '...';
        }
        return value;
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

    _handleFilterChange(e) {
        this.setState({settingsFilter: e.target.value});
    }

    render() {
        const metricsTranslation = {
            MessagesInPerSec: 'Messages in',
            BytesInPerSec: 'Bytes in',
            BytesOutPerSec: 'Bytes out',
            BytesRejectedPerSec: 'Bytes rejected',
            FailedFetchRequestsPerSec: 'Failed fetch requests',
            FailedProduceRequestsPerSec: 'Failed produce requests',
            FetchMessageConversionsPerSec: 'Fetch message conversion',
            ProduceMessageConversionsPerSec: 'Produce message conversion',
            ReplicationBytesInPerSec: 'Replication bytes in',
            ReplicationBytesOutPerSec: 'Replication bytes out',
            TotalFetchRequestsPerSec: 'Total fetch requests',
            TotalProduceRequestsPerSec: 'Total produce requests'
        };

        return (
            <div className="clusters view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/cluster">Cluster</Link></span>
                </div>
                {this.state.loadingBrokers ? <Loader/> :
                    this.state.errorLoadingBrokers ? <Error error="Cannot load cluster configuration."/> : (
                        <div className="cluster-content">
                            <div className="cluster-settings box">
                                <span className="title">Infos</span>
                                <div className="cluster-settings-lines">
                                    <div className="cluster-settings-line">
                                        <span className="cluster-settings-line-key">Zookeeper : </span>
                                        <span
                                            className="cluster-settings-line-value">{this.state.brokersSettings.zookeeper ? this.state.brokersSettings.zookeeper['zookeeper.connect'] : ''}</span>
                                    </div>
                                    <div className="cluster-settings-line">
                                        <span className="cluster-settings-line-key">Kafka : </span>
                                        <span
                                            className="cluster-settings-line-value">{this.state.brokers ? this.state.brokers.map((broker) => broker.host + ':' + broker.port).join(',') : ''}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="panel">
                                <div className="left">
                                    <div className="brokers-summary box">
                                        <span className="title">Brokers</span>

                                        <PerfectScrollbar className="brokers-summary-scrollbar">
                                            <Metrics fields={{
                                                id: 'Id',
                                                host: 'Host',
                                                port: 'Port',
                                                bytesIn: 'Bytes In (per sec)',
                                                bytesOut: 'Bytes Out (per sec)'
                                            }} metrics={this.state.brokers}/>
                                        </PerfectScrollbar>
                                    </div>

                                    <div className="brokers-metrics box">
                                        <span className="title">Metrics</span>
                                        <PerfectScrollbar className="brokers-metrics-scrollbar">
                                            {this.state.loadingMetrics || !this.state.metrics ? <Loader/> :
                                                this.state.errorLoadingMetrics ? <Error error="Cannot load metrics."/> :
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
                                            }
                                        </PerfectScrollbar>
                                    </div>
                                </div>
                                <div className="right">
                                    <div className="brokers-settings box">
                                        <span className="title">Settings
                                          <div className="input-field">
                                              <input type="text" placeholder="filter" value={this.state.filter}
                                                     onChange={this._handleFilterChange.bind(this)}/>
                                          </div>
                                        </span>
                                        <PerfectScrollbar className="brokers-settings-scrollbar">
                                            <div className="brokers-settings-containers">
                                                {Object.keys(this.state.brokersSettings)
                                                    .filter(configurationGroupKey => {
                                                        return Object.keys(this.state.brokersSettings[configurationGroupKey]).find(key => key.includes(this.state.settingsFilter));
                                                    })
                                                    .map(settingCategory => {
                                                        return (
                                                            <div className="brokers-settings-container">
                                                                <h4 className="brokers-settings-container-category">{settingCategory}</h4>

                                                                <div className="brokers-settings-container-lines">
                                                                    {Object.keys(this.state.brokersSettings[settingCategory])
                                                                        .filter(key => key.includes(this.state.settingsFilter))
                                                                        .sort((a, b) => a < b ? -1 : 1).map(settingName => {
                                                                            return (
                                                                                <div
                                                                                    className="brokers-settings-container-line">
                                                    <span className="broker-settings-container-line-key">
                                                        {settingName}
                                                    </span>
                                                                                    :
                                                                                    <span
                                                                                        className={ClassNames('broker-settings-container-line-value', this._getValueType(this.state.brokersSettings[settingCategory][settingName]))}>
                                                            {this._reduceValueSize(this.state.brokersSettings[settingCategory][settingName] || "null")}
                                                    </span>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        </PerfectScrollbar>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        );
    }
}

export default Clusters;
