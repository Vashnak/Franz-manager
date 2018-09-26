import React from 'react';

import Utils from "../../modules/Utils";
import PropTypes from 'prop-types';

import './Metrics.scss';

class Metrics extends React.Component {
    static propTypes = {
        metrics: PropTypes.array,
        fields: PropTypes.object
    };

    render() {
        const metrics = this.props.metrics;
        const fields = this.props.fields;
        return (
            <div className="metrics">
                <table>
                    <thead>
                    <tr>
                        {
                            Object.keys(fields).map((key, index) => {
                                return <th key={index + key}>{fields[key]}</th>
                            })
                        }
                    </tr>
                    </thead>
                    <tbody>
                    {
                        metrics.map(metric => {
                            return <tr key={metric.label}>
                                {Object.keys(fields).map((key, index) => {
                                    return <td
                                        key={index + key}>{!isNaN(metric[key]) && key !== 'port' ? Utils.formatMetric(Number(metric[key]).toFixed(0)) : metric[key] || 'N/A' }</td>
                                })}
                            </tr>
                        })
                    }
                    </tbody>
                </table>
            </div>
        );
    }
}


export default Metrics;
