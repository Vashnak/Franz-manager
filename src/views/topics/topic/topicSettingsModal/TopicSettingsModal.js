import React, {Component} from 'react';
import Modal from "../../../../shared/Modal";
import classNames from "classnames";
import PerfectScrollbar from "react-perfect-scrollbar";
import AceEditor from 'react-ace';

import Loader from "../../../../components/loader/Loader";
import Error from "../../../../components/error/Error";
import TopicsService from "../../../../services/TopicsService";
import {EditIcon} from "../../../../services/SvgService";

import 'brace/mode/json';
import 'brace/theme/github';
import './TopicSettingsModal.scss';

class TopicSettingsModal extends Component {
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
            mode: 'reading',
            filter: ''
        }
    }

    componentWillMount() {
        this._loadTopicDetails(this.props.topicId)
    }

    _loadTopicDetails(topicId) {
        TopicsService.getTopicDetails(topicId)
            .then(td => {
                console.log(td);
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
        if (this.state.updatedTopicConfiguration) {
            try {
                let configuration = JSON.parse(this.state.updatedTopicConfiguration);
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

    _handleFilterChange(e) {
        this.setState({filter: e.target.value});
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
        return (
            <Modal className="topic-settings-modal">
                <span className="title">Settings {this.state.mode === 'reading' &&
                <EditIcon width={20} height={20} className="edit-icon"
                          onClick={this._editMode.bind(this)}/>}
                    <div style={{flex: "1 1"}}/>
                          <div className="input-field">
                              <input type="text" placeholder="filter" value={this.state.filter}
                                     onChange={this._handleFilterChange.bind(this)}/>
                          </div>
                          </span>
                {this.state.loadingConfiguration ? <Loader/> :
                    this.state.errorLoadingConfiguration ? <Error error="Cannot load settings."/> :
                        this.state.mode === 'reading' ? (
                            <div className="topic-settings">
                                <PerfectScrollbar>
                                    {
                                        Object.keys(this.state.topicConfiguration)
                                            .filter(configurationGroupKey => {
                                                return Object.keys(this.state.topicConfiguration[configurationGroupKey]).find(key => key.includes(this.state.filter));
                                            })
                                            .map((configurationGroupKey, i) => {
                                                return (
                                                    <div className="topic-details-configurationGroup"
                                                         key={configurationGroupKey + '-' + i}>
                                                        <h5 className="topic-details-configurationGroup-title">{configurationGroupKey}</h5>
                                                        {
                                                            Object.keys(this.state.topicConfiguration[configurationGroupKey])
                                                                .filter(key => key.includes(this.state.filter))
                                                                .sort((a, b) => a < b ? -1 : 1)
                                                                .map((configurationKey, j) => {
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
                                </PerfectScrollbar>

                                <div className="close-modal-button">
                                    <a className="waves-effect waves-light btn"
                                       onClick={this.props.close}>Close</a>
                                </div>
                            </div>
                        ) : (
                            <div className="edition">
                                <AceEditor
                                    mode="json"
                                    theme="github"
                                    name="ace-editor"
                                    fontSize={18}
                                    onChange={value => this.setState({updatedTopicConfiguration: value})}
                                    value={this.state.updatedTopicConfiguration ? this.state.updatedTopicConfiguration :
                                        JSON.stringify(this.state.brutTopicConfiguration, null, '\t')}
                                    editorProps={{$blockScrolling: true, showGutter: false}}
                                />
                                <div className="edit-modal-buttons">
                                    <a className="waves-effect waves-light btn"
                                       onClick={this._updateTopicConfiguration.bind(this)}>Save</a>
                                    <a className="waves-effect waves-light btn"
                                       onClick={this._readingMode.bind(this)}>Cancel</a>
                                </div>
                            </div>
                        )
                }

                {/*{this.state.editConfigModal && (
                    <Portal>
                        <div className="edit-config-modal">
                            <div className="content">
                                <div className="title">Edit configuration</div>
                                <AceEditor
                                    mode="json"
                                    theme="github"
                                    name="ace-editor"
                                    fontSize={18}
                                    onChange={value => this.setState({updatedTopicConfiguration: value})}
                                    value={this.state.updatedTopicConfiguration ? this.state.updatedTopicConfiguration :
                                        JSON.stringify(this.state.brutTopicConfiguration, null, '\t')}
                                    editorProps={{$blockScrolling: true}}
                                />
                                <div className="edit-configuration-buttons">
                                    <a className={"waves-effect waves-light btn update" + (this.state.updatedTopicConfiguration ? '' : ' disabled')}
                                       onClick={this._updateTopicConfiguration.bind(this)}>Update</a>
                                    <a className="waves-effect waves-light btn cancel"
                                       onClick={() => this.setState({editConfigModal: false})}>Cancel</a>
                                </div>
                            </div>
                        </div>
                    </Portal>
                )}*/}
            </Modal>
        );
    }
}

export default TopicSettingsModal;
