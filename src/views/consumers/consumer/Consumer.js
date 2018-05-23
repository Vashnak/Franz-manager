import React from 'react';
import {Link} from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';

import './Consumer.scss';
import ConsumersService from "../../../services/ConsumersService";
import TopicsService from "../../../services/TopicsService";

class Consumer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            consumerId: this.props.match.params.consumerId.replace(/,/g, '.'),
            topics: {},
            loadingTopics: true,
            filter: ''
        };
    }

    componentWillMount() {
        ConsumersService.getConsumers(this.state.consumerId)
            .then(consumers => {
                this.setState({
                    topics: consumers.reduce((prev, next) => {
                        if (!prev[next.topic]) {
                            prev[next.topic] = []
                        }
                        next.consumerOffset = next.offset;
                        delete next.offset;
                        prev[next.topic].push(next);
                        return prev;
                    }, {}),
                    loadingTopics: false
                });

                const tasks = Object.keys(this.state.topics).map(topic => TopicsService.getTopicPartitions(topic))
                return Promise.all(tasks);
            })
            .then(partitionsArray => {
                let topics = Object.assign({}, this.state.topics);
                const partitions = partitionsArray.flatten();
                partitions.forEach(partition => {
                    let topic = topics[partition.topic].find(t => t.partition === partition.partition);
                    if(topic) topic.topicOffset = partition.endOffset;
                });
                this.setState({topics})
            })
    }

    _updatefilter(e) {
        this.setState({
            filter: e.target.value
        })
    }

    _calcLag(topic) {
        let partitions = this.state.topics[topic];

        if (partitions) {
            return partitions.reduce((prev, next) => {
                return prev + (next.topicOffset - next.consumerOffset);
            }, 0);
        }

        return '?';
    }

    render() {
        const topics = this.state.topics;
        const shownTopics = {};
        Object.keys(topics).forEach(topic => {
            if (!this.state.filter || topic.includes(this.state.filter)) {
                shownTopics[topic] = topics[topic];
            }
        });
        const shownTopicsLength = Object.keys(shownTopics).length;
        const totalTopicsLength = Object.keys(topics).length;
        return (
            <div className="consumer view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/consumers">Consumers</Link></span>
                    <span className="breadcrumb"><Link
                        to={'/franz-manager/consumers/' + this.state.consumerId.replace(/\./g, ',')}>{this.state.consumerId}</Link></span>
                </div>
                <div className="search-bar">
                    <input type="text" className="search-input-text" placeholder="Filter by topic"
                           onChange={this._updatefilter.bind(this)}/>
                    <span
                        className="topics-items-length">{shownTopicsLength + ' / ' + totalTopicsLength + ' shown topics'}</span>

                    <div style={{flex: '1 1'}}/>
                    {topics && <span
                        className="consumer-total-lag"> Total lag: {Object.values(topics).flatten().reduce((prev, next) => prev + (next.topicOffset - next.consumerOffset), 0)} message(s)</span>}
                </div>
                <div className="topics">
                    <PerfectScrollbar>
                        {
                            Object.keys(shownTopics).map(topic => {
                                return (
                                    <div className="topic-consumed box">
                                        <span className="title">{topic} <Link
                                            to={`/franz-manager/topics/${topic.replace(/\./g, ',')}`}>Go to topic view</Link></span>
                                        <div className="topic-consumed-partitions">
                                            <table>
                                                <thead>
                                                <tr>
                                                    <th>Partition</th>
                                                    <th>Topic offset</th>
                                                    <th>Consumer offset</th>
                                                    <th>Lag <span className="topic-lag">({this._calcLag(topic)})</span>
                                                    </th>
                                                    <th>Commit timestamp</th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {
                                                    shownTopics[topic].sort((a, b) => a.partition - b.partition).map(partition => {
                                                        return (
                                                            <tr className="topic-consumed-partition">
                                                                <td>{partition.partition}</td>
                                                                <td>{typeof partition.topicOffset !== 'undefined' ? partition.topicOffset : 'unknown'}</td>
                                                                <td>{partition.consumerOffset}</td>
                                                                <td>{typeof partition.topicOffset !== 'undefined' ? partition.topicOffset - partition.consumerOffset : 'unknown'}</td>
                                                                <td>{partition.commitTimestamp}</td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                )
                            })
                        }
                    </PerfectScrollbar>
                </div>
            </div>
        );
    }
}

export default Consumer;
