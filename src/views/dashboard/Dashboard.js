import React from 'react';
import {Link} from 'react-router-dom';
import * as Vis from 'vis';
import BrokersService from '../../services/BrokersService';

import kafkaImg from '../../images/kafka.jpg'

import 'vis/dist/vis.css';
import './Dashboard.scss';

class Dashboard extends React.Component {

    componentDidMount() {
        BrokersService.getBrokers()
            .then(b => {
                let nodes = null;
                let edges = null;
                let EDGE_LENGTH_SUB = 100;

                nodes = [];
                edges = [];

                nodes.push({id: 'Cluster'});

                b.forEach(broker => {
                    let brokerInfo = `Broker ${broker.id}\nhost: ${broker.host}\nport: ${broker.port}`;
                    nodes.push({
                        id: broker.id,
                        label: brokerInfo,
                        image: kafkaImg,
                        shape: 'image'
                    });
                    edges.push({from: broker.id, to: 'Cluster', length: EDGE_LENGTH_SUB});
                });

                let vis = new Vis.Network(document.getElementById('visualization'), {nodes, edges}, {});
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
