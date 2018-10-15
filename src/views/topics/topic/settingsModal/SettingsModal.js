import React, {Component} from 'react';

import classnames from 'classnames';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TopicsService from "../../../../services/TopicsService";
import Modal from "../../../../components/modal/Modal";
import Ink from 'react-ink';
import Loader from "../../../../components/loader/Loader";

class SettingsModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loadingConfiguration: true,
            errorLoadingConfiguration: false,
            topicConfiguration: {
                messages: {},
                retention: {},
                replication: {},
                segment: {},
                others: {}
            },
            updatedFields: {},
            mode: 'reading',
            filter: ''
        }
    }

    componentWillMount() {
        this._loadTopicDetails(this.props.topic)
    }

    _loadTopicDetails(topicId) {
        TopicsService.getTopicDetails(topicId)
            .then(td => {
                let configurations = td.configurations;
                let topicConfiguration = this.state.topicConfiguration;

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

                this.setState({
                    brutTopicConfiguration: td.configurations,
                    topicConfiguration,
                    loadingConfiguration: false
                })
            })
            .catch(() => {
                this.setState({loadingConfiguration: false, errorLoadingConfiguration: true})
            });
    }

    _updateTopicConfiguration() {
        if (Object.keys(this.state.updatedFields).length > 0) {
            try {
                let configuration = this.state.brutTopicConfiguration;
                for (let key in this.state.updatedFields) {
                    configuration[key] = this.state.updatedFields[key];
                }
                this.setState({
                    topicConfiguration: {
                        messages: {},
                        retention: {},
                        replication: {},
                        segment: {},
                        others: {}
                    },
                    loadingConfiguration: true,
                    mode: 'reading'
                });
                TopicsService.updateTopicConfiguration(this.props.topicId, configuration)
                    .then(() => {
                        setTimeout(() => this._loadTopicDetails(this.props.topicId), 100);
                    });
            } catch (e) {
                console.error(e);
            }
        }
    }

    _editMode() {
        this.setState({mode: 'edition'});
    }

    _readingMode() {
        this.setState({mode: 'reading'});
    }

    _onFieldChange(e) {
        const updatedFields = this.state.updatedFields;
        const valueType = this._getValueType(e.target.value);
        switch (valueType) {
            case 'boolean':
                updatedFields[e.target.name] = e.target.value === 'true';
                break;
            case 'number':
                updatedFields[e.target.name] = parseFloat(e.target.value);
                break;
            case 'null':
                updatedFields[e.target.name] = null;
                break;
            default:
                updatedFields[e.target.name] = e.target.value;
                break;
        }
        this.setState({updatedFields});
    }

    _getValueType(value) {
        if (value === 'true' || typeof value === 'boolean')
            return 'boolean';
        if (+value === parseInt(value) || +value === parseFloat(value))
            return 'number';
        if (value === "null" || value === "" || value === undefined || value === null)
            return 'null';
        return 'string';
    }

    render() {
        return (
            <div className="settingsModal modal">
                <Modal title="Settings"
                       close={this.props.close}
                       actions={this.state.mode === 'reading' ? [{
                           action: this._editMode.bind(this),
                           label: "Edit"
                       }] : [{action: this._readingMode.bind(this), label: "Cancel"}, {
                           action: this._updateTopicConfiguration.bind(this),
                           label: "Save"
                       }]}>
                    {this.state.loadingConfiguration ? <Loader/> :
                        [<section className="topic-settings flex-1">
                            <PerfectScrollbar className="scrollbar settings-list">
                                {
                                    Object.keys(this.state.topicConfiguration)
                                        .filter(configurationGroupKey => {
                                            return Object.keys(this.state.topicConfiguration[configurationGroupKey]).find(key => key.includes(this.state.filter));
                                        })
                                        .map((configurationGroupKey, i) => {
                                            return (
                                                <div className="margin-top-16px"
                                                     key={configurationGroupKey + '-' + i}>
                                                    <h4>{configurationGroupKey}</h4>
                                                    {
                                                        Object.keys(this.state.topicConfiguration[configurationGroupKey])
                                                            .filter(key => key.includes(this.state.filter))
                                                            .sort((a, b) => a < b ? -1 : 1)
                                                            .map((configurationKey, j) => {
                                                                return (
                                                                    <div className="settings-item flex space-between align-center"
                                                                         key={configurationKey + '-' + j}>
                                                                    <span
                                                                        className="settings-line-key">{configurationKey}:</span>
                                                                        {this.state.mode === 'reading' ? <span
                                                                            className={classnames('settings-line-' + this._getValueType(this.state.topicConfiguration[configurationGroupKey][configurationKey]))}>
                                                        {this.state.topicConfiguration[configurationGroupKey][configurationKey] || "null"}
                                                    </span> : <input type="text" className="setting-edit"
                                                                     name={configurationKey}
                                                                     defaultValue={this.state.topicConfiguration[configurationGroupKey][configurationKey] || "null"}
                                                                     onChange={this._onFieldChange.bind(this)}/>
                                                                        }

                                                                    </div>
                                                                )
                                                            })
                                                    }
                                                </div>
                                            )
                                        })
                                }
                            </PerfectScrollbar>
                        </section>,
                            <footer>

                                <div className="actions margin-left-24px text-right">
                                    <button className="regular"
                                            onClick={this.props.close}>
                                        Close
                                        <Ink/>
                                    </button>
                                </div>
                            </footer>]}


                </Modal>
            </div>
        );
    }
}

export default SettingsModal;
