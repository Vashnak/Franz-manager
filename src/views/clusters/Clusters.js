import React from 'react';
import {Link} from 'react-router-dom';
import Scrollbar from 'react-custom-scrollbars';
import ClassNames from 'classnames';

import './Clusters.scss';

import Utils from "../../modules/Utils";
import BrokersService from "../../services/BrokersService";
import Loader from "../../components/loader/Loader";
import Error from '../../components/error/Error';
import Metrics from '../../components/metrics/Metrics';

class Clusters extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loadingBrokers: true,
            brokers: [],
            brokersSettings: {},
            clusterSettings: {}
        }
    }

    componentWillMount() {
        BrokersService.getBrokers()
            .then(brokers => {
                let brokersSettings = {
                    ssl: {},
                    replicats: {},
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
                        brokersSettings.replicats[key] = broker.configurations[key];
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

    render() {
        console.log(this.state.brokers)
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
                                    <div>
                                        <div className="brokers-summary box">
                                            <span className="title">Brokers</span>

                                            <Metrics fields={{
                                                id: 'Id',
                                                host: 'Host',
                                                port: 'Port',
                                                bytesIn: 'Bytes In',
                                                bytesOut: 'Bytes Out'
                                            }} metrics={this.state.brokers}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="right">
                                    <div className="brokers-settings box">
                                        <span className="title">Settings</span>
                                        <Scrollbar className="brokers-settings-scrollbar">
                                            <div className="brokers-settings-containers">
                                                {Object.keys(this.state.brokersSettings).map(settingCategory => {
                                                    return (
                                                        <div className="brokers-settings-container">
                                                            <h4 className="brokers-settings-container-category">{settingCategory}</h4>

                                                            <div className="brokers-settings-container-lines">
                                                                {Object.keys(this.state.brokersSettings[settingCategory]).sort((a, b) => a < b ? -1 : 1).map(settingName => {
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
                                        </Scrollbar>
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