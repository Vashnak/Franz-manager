import React from 'react';
import {Link} from 'react-router-dom';

import './Dashboard.scss';

class Dashboard extends React.Component {
    render() {
        return (
            <div className="dashboard view">
                <div className="breadcrumbs">
                    <span className="breadcrumb"><Link to="/franz-manager/dashboard">Dashboard</Link></span>
                </div>
                <div className="box">
                    Nothing to see here !
                </div>
            </div>
        );
    }
}

export default Dashboard;