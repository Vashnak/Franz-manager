import React, {Component} from 'react';
import classnames from 'classnames';
import Switch from "../switch/Switch";

class Filter extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filter: this.props.value || '',
            filterByRegexp: this.props.filterByRegexp || false
        }
    }

    _updateFilter(e) {
        let filters = {
            filter: e.target.value,
            filterByRegexp: this.state.filterByRegexp
        };
        this.setState(filters);
        this.props.onChange(filters);
    }

    _updateRegexp() {
        let filters = {
            filter: this.state.filter,
            filterByRegexp: !this.state.filterByRegexp
        };
        this.setState(filters);
        this.props.onChange(filters);
    }

    render() {
        return (
            <div
                className={classnames("filter", "component", "flex", "flex-1", ...(this.props.className || {}))}>
                <input onChange={this._updateFilter.bind(this)} value={this.state.filter}
                       type="text" placeholder="filter"
                       className={classnames({regex: this.state.filterByRegexp}, "flex-1", "margin-left-32px")}/>

                <Switch className="reg" onChange={this._updateRegexp.bind(this, 'Regex')}
                        value={this.state.filterByRegexp} label="Regex"/>

            </div>
        );
    }
}

export default Filter;

/*
<input onChange={this._updatefilter.bind(this)} value={this.state.filter}
                                               type="text" placeholder="filter" className="flex-1 margin-left-32px"/>
 */
