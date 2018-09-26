import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Modal from '../../../shared/Modal';
import Loader from '../../../components/loader/Loader';

import {WarningIcon} from "../../../services/SvgService";

import './DeleteTopicsModal.scss';

class DeleteTopicsModal extends Component {
    static propTypes = {
        topicsToDelete: PropTypes.array.isRequired,
        deleteTopics: PropTypes.func.isRequired,
        closeModal: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            confirmationMessage: false,
            badInput: false,
            deleting: false
        }
    }

    _deleteTopics(topics) {
        if (!this.refs['input-topics-number'] || +this.refs['input-topics-number'].value !== topics.length) {
            return this.setState({badInput: true});
        }
        this.setState({badInput: false, deleting: true});
        this.props.deleteTopics(topics)
            .then(() => {
                this.setState({deleting: false});
            });
    }

    render() {
        return (
            <Modal className="delete-topics-modal">
                <p className="warning"><b><WarningIcon width={32} height={32} fill={"red"}/></b> You are going to
                    delete <b>{this.props.topicsToDelete.length}</b> topic{this.props.topicsToDelete.length > 1 ? "s" : ""}.
                </p><br/>
                <div className="topics">
                    {this.props.topicsToDelete.map((t, index) => <div key={index}
                                                                      className="topic">{t.id}</div>)}
                </div>
                <br/>
                {this.state.deleting ? (
                    <div>
                        <Loader/>
                        <div style={{textAlign: "center", paddingTop: 10}}>Deleting ...</div>
                    </div>
                ) : !this.state.confirmationMessage ? (
                    <div className="first-confirm-line">
                        <b>Do you really want to do this ?</b>
                        <div style={{flex: "1 1"}}/>
                        <input type="button"
                               onClick={() => this.setState({confirmationMessage: true})}
                               className="yes waves-effect waves-light btn" value="yes"/>
                        <input type="button" onClick={this.props.closeModal}
                               className="no waves-effect waves-light btn" value="no"/>
                    </div>
                ) : (
                    <div className="second-confirm-line">
                        <b>Please confirm by typing the number of topics you are going to
                            delete (you will be fired if you screw up)</b><br/>
                        <div style={{display: 'flex', marginTop: '10px'}}>
                            <input type="text"
                                   className="input-topics-number"
                                   style={{
                                       borderColor: this.state.badInput ? "red" : "lightgrey",
                                       backgroundColor: 'rgba(0,0,0,0.05);'
                                   }}
                                   placeholder="How many ?"
                                   ref="input-topics-number"/>
                            <div style={{flex: "1 1"}}/>
                            <input type="button"
                                   onClick={this._deleteTopics.bind(this, this.props.topicsToDelete)}
                                   className="yes waves-effect waves-light btn"
                                   value="yes"/>
                            <input type="button" onClick={this.props.closeModal}
                                   className="no waves-effect waves-light btn" value="no"/>
                        </div>
                    </div>
                )}
            </Modal>
        );
    }
}
export default DeleteTopicsModal;
