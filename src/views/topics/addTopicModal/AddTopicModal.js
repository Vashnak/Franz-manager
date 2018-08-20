import React, {Component} from 'react';
import Ink from 'react-ink';

import './AddTopicModal.scss';
import Modal from "../../../components/modal/Modal";
import TopicsService from "../../../services/TopicsService";

class AddTopicModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            default: "default"
        }
    }

    _createTopic() {
        const topicName = this.refs['topic-name-input'].value;
        if (!topicName) {
            return;
        }
        TopicsService.addTopic(topicName)
            .then(() => {
                this.props.reloadTopics();
                this.props.close();
            })
    }

    render() {
        return (
            <div className="addTopicModal modal">
                <Modal title="Add topic"
                       close={this.props.close}>
                    <section>
                        <input type="text" placeholder="Topic name" ref="topic-name-input"/>
                    </section>
                    <footer>
                        <div className="actions margin-left-24px flex justify-end">
                            <button className="regular"
                                    onClick={this._createTopic.bind(this)}>
                                Confirm
                                <Ink/>
                            </button>
                            <button className="regular margin-left-8px"
                                    onClick={this.props.close}>
                                Cancel
                                <Ink/>
                            </button>
                        </div>
                    </footer>
                </Modal>
            </div>
        );
    }
}

export default AddTopicModal;
