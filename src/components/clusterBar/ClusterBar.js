import React, {Component} from 'react';

import './ClusterBar.scss';
import ClustersService from "../../services/ClustersService";

class ClusterBar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: null,
            clusters: []
        }
    }

    componentWillMount() {
        ClustersService.getClusters()
            .then(clusters => {
                let selectedClusterId = ClustersService.getSelectedClusterId();
                if (!selectedClusterId) {
                    ClustersService.setSelectedClusterId(clusters[0].name);
                    selectedClusterId = clusters[0].name;
                    this.setState({clusters, selected: selectedClusterId});
                    window.location.reload(true);
                } else {
                    this.setState({clusters, selected: selectedClusterId});
                }
            })
    }

    _selectCluster(clusterName){
        ClustersService.setSelectedClusterId(clusterName);
        window.location.reload(true);
    }

    render() {
        return (
            <div className="clusterBar">
                <span>Current cluster: </span>
                <ul>
                    {this.state.clusters.map(cluster => {
                        return <li onClick={this._selectCluster.bind(this, cluster.name)}
                            className={this.state.selected === cluster.name ? "selected" : ""}>{cluster.name}</li>
                    })}
                </ul>
            </div>
        );
    }
}

export default ClusterBar;
