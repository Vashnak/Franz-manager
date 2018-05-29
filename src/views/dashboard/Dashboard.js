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
                        id: broker.id,
                        label: brokerInfo,
                        image: kafkaImg,
                        shape: 'image'
                    });
                    edges.push({from: broker.id, to: 'Cluster', length: 200});
                });

                serializedZookeepers.forEach(sz => {
                    nodes.push({
                        id: sz.id,
                        label: `Zookeeper \nhost: ${sz.host}\nport: ${sz.port}`,
                        image: zookeeperImg,
                        shape: 'image'
                    });
                    edges.push({from: sz.id, to: 'Cluster', length: 100});
                });

                new Vis.Network(document.getElementById('visualization'), {nodes, edges}, {});
            });
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
