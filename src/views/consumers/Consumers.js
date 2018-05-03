import React from 'react';
import {Link} from 'react-router-dom';
import Loader from '../../components/loader/Loader';
import Error from '../../components/error/Error';
import Scrollbar from 'react-custom-scrollbars';

import './Consumers.scss';
import ConsumersService from "../../services/ConsumersService";

class Consumers extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loadingConsumers: true,
            errorLoadingConsumers: false,
            consumers: [],
            filter: ''
        };
    }

    componentWillMount() {
        ConsumersService.getConsumers()
            .then(consumers => {
                this.setState({
                    consumers: consumers.reduce((prev, next) => {
                        if (!prev[next.group]) {
                            prev[next.group] = {};
                        }
                        if (!prev[next.group][next.topic]) {
                            prev[next.group][next.topic] = []
                        }
                        prev[next.group][next.topic].push(next);
                        return prev;
                    }, {}),
                    loadingConsumers: false
                });
            })
            .catch(() => this.setState({loadingConsumers: false, errorLoadingConsumers: true}))
    }

    _updatefilter(e) {
        this.setState({
            filter: e.target.value
        })
    }

    render() {
        const consumers = this.state.consumers;
        const shownConsumers = {};
        Object.keys(consumers).forEach(consumer => {
            if(!this.state.filter || consumer.toLowerCase().includes(this.state.filter.toLowerCase())){
                shownConsumers[consumer] = consumers[consumer];
            }
        });
        const totalConsumerLength = Object.keys(consumers).length;
        const shownConsumerLength = Object.keys(shownConsumers).length;
        return (
            <div className="consumers view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/consumers">Consumers</Link></span>
                </div>

                <div className="search-bar">
                    <input type="text" className="search-input-text" placeholder="Filter by consumer"
                           onChange={this._updatefilter.bind(this)}/>
                    <span
                        className="consumers-items-length">{shownConsumerLength + ' / ' + totalConsumerLength + ' shown consumers'}</span>
                </div>
                <div className="consumers-items collection box">
                    {
                        this.state.loadingConsumers ? <Loader/> : (
                            this.state.errorLoadingConsumers ? <Error error="Cannot load consumers."/> : (
                            <Scrollbar>
                                <div className="topics-classic-view">
                                    {
                                        Object.keys(shownConsumers).sort((a, b) => a < b ? -1 : 1).map(consumerId => {
                                            return (
                                                <li className="consumers-item collection-item">
                                                    <Link
                                                        to={'/franz-manager/consumers/' + consumerId.replace(/\./g, ',')}>{consumerId}</Link>
                                                    <span className="consumers-item-topics-number">
                                                        {Object.keys(shownConsumers[consumerId]).length + ' topic' + (Object.keys(shownConsumers[consumerId]).length > 1 ? 's' : '')}
                                                    </span>
                                                </li>
                                            )
                                        })
                                    }
                                </div>
                            </Scrollbar>
                            )
                        )}
                </div>
            </div>
        );
    }
}

export default Consumers;