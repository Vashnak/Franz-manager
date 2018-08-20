import React, {Component} from 'react';
import ClustersService from "../../services/ClustersService";
import Menu from '../menu/Menu';
import Option from '../menu/option/Option';

class ClusterBar extends Component {
    constructor(props) {
        super(props);
        this.clusterSelect = React.createRef();

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

    _changeCluster(cluster) {
        this.setState({selected: cluster});
        ClustersService.setSelectedClusterId(cluster);
        window.location.reload(true);
    }

    render() {
        return (
            <Menu label={'Cluster ' + this.state.selected} selected={this.state.selected} ref={this.clusterSelect}
                  onChange={this._changeCluster.bind(this)}>
                {this.state.clusters.map(cluster => {
                    return <Option
                        onChange={this.clusterSelect.current._selectOption.bind(this.clusterSelect.current)}
                        value={cluster.name}
                        ref={cluster.name}
                        key={cluster.name}
                        selected={this.state.selected}>
                        Cluster {cluster.name}
                    </Option>;
                })}
            </Menu>

        );
    }
}

export default ClusterBar;
