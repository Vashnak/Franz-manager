import React from 'react';
import {Link} from 'react-router-dom';
import * as Vis from 'vis';
import BrokersService from '../../services/BrokersService';

import kafkaImg from '../../images/kafka.jpg'
import zookeeperImg from '../../images/zookeeper.gif'

import 'vis/dist/vis.css';
import './Dashboard.scss';

class Dashboard extends React.Component {

    componentDidMount() {
        BrokersService.getBrokers()
            .then(b => {
                    let nodes = null;
                    let edges = null;

                    nodes = [];
                    edges = [];

                    nodes.push({id: 'Cluster'});

                    let serializedZookeepers = [];

                    b.forEach(broker => {
                        let zookeepers = broker.configurations["zookeeper.connect"].replace('/kafka', '').split(',');
                        zookeepers.forEach(z => {
                            let splitted = z.split(':');
                            if (!serializedZookeepers.find(sz => sz.host === splitted[0] && sz.port === splitted[1])) {
                                serializedZookeepers.push({
                                    id: z,
                                    host: splitted[0],
                                    port: splitted[1]
                                })
                            }
                        });

                        let brokerInfo = `Broker ${broker.id}\nhost: ${broker.host}\nport: ${broker.port}`;
                        nodes.push({
                            id: "broker-" + broker.id,
                            label: brokerInfo,
                            image: kafkaImg,
                            shape: 'image'
                        });
                        edges.push({from: "broker-" + broker.id, to: 'Cluster', length: 200});
                    });

                    serializedZookeepers.forEach(sz => {
                        nodes.push({
                            id: "zookeeper-" + sz.id,
                            label: `Zookeeper \nhost: ${sz.host}\nport: ${sz.port}`,
                            image: zookeeperImg,
                            shape: 'image'
                        });
                        edges.push({from: "zookeeper-" + sz.id, to: 'Cluster', length: 200});
                    });

                    nodes.forEach(node1 => {
                        nodes.forEach(node2 => {
                            if (node1.id.includes('zookeeper') && node2.id.includes('zookeeper')
                                || node1.id.includes('broker') && node2.id.includes('broker')) {
                                let exist = edges.find(e => {
                                    return (e.from === node1.id && e.to === node2.id)
                                        || (e.from === node2.id && e.to === node1.id);
                                });
                                if (!exist && node1.id !== node2.id) {
                                    edges.push({from: node1.id, to: node2.id, length: 200, color: {color: "rgba(0,0,0,0.08)"}});
                                }
                            }
                        })
                    });

                    const vis = new Vis.Network(document.getElementById('visualization'), {nodes, edges}, {});
                    vis.moveTo({
                            scale: 1.5,
                            animation: {
                                duration: 1000000,
                                easingFunction: "linear"
                            }
                        }
                    )
                }
            );
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    render() {
        return (
            <div className="dashboard view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/dashboard">Dashboard</Link></span>
                </div>
                <div className="box">
                    <div id="visualization"></div>
                </div>

            </div>
        );
    }
}

export default Dashboard;
