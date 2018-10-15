import React, {Component} from 'react';

import classnames from 'classnames';
import PerfectScrollbar from 'react-perfect-scrollbar';
import TopicsService from "../../../../services/TopicsService";
import Modal from "../../../../components/modal/Modal";
import Ink from 'react-ink';

class EditPartitionsModal extends Component {
    constructor(props) {
        super(props);

        this.state = {}
    }

    _updatePartitions() {
        if (!this.refs['partition-input'].value || isNaN(this.refs['partition-input'].value)) {
            alert('Input must be an integer.');
        } else if (+this.refs['partition-input'].value <= this.props.currentPartitions) {
            alert('Input has to be greater than ' + this.props.currentPartitions + '.');
        }
        TopicsService.addTopicPartitions(this.props.topic, (+this.refs['partition-input'].value) - this.props.currentPartitions)
            .then(() => {
                this.props.refreshPartitions();
                this.props.close();
            });
    }

    render() {
        return (
            <div className="editPartitionModal modal">
                <Modal title="Update partitions"
                       close={this.props.close}>
                    <section className="topic-settings flex-1 flex flex-column">
                        <label className="margin-top-8px">How many partitions do you want ?</label>
                        <input className="margin-top-16px" type="text" placeholder={this.props.currentPartitions}
                               ref="partition-input"/>
                    </section>
                    <footer>
                        <div className="actions margin-left-24px text-right">
                            <button className="regular"
                                    onClick={this._updatePartitions.bind(this)}>
                                Confirm
                                <Ink/>
                            </button>
                            <button className="regular margin-left-8px"
                                    onClick={this.props.close}>
                                Close
                                <Ink/>
                            </button>
                        </div>
                    </footer>
                </Modal>
            </div>
        );
    }
}

export default EditPartitionsModal;
