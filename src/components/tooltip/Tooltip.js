import React, {Component} from 'react';

import './Tooltip.scss';

class Tooltip extends Component {
    constructor(props) {
        super(props);
        this.key = Math.random().toFixed(5);
    }

    componentDidMount() {
        this.refs[this.key].style.opacity = 0;
    }

    _showTooltip(x, y) {
        let newX = x;
        const tooltip = this.refs[this.key];
        tooltip.style.opacity = 1;
        tooltip.classList.add('animate');
        const tooltipWidth = tooltip.getBoundingClientRect().width;
        if(tooltipWidth + x > document.body.offsetWidth + 16){
            newX = document.body.offsetWidth - tooltipWidth - 16;
        }
        tooltip.style.left = newX;
        tooltip.style.top = y - 24;
        // tooltip.
    }

    _handleMouseEntered(e) {
        e.persist();
        this.timeout = setTimeout(() => {
            const bounding = e.target.getBoundingClientRect();
            this._showTooltip(bounding.x, bounding.y);
        }, 200);
    }

    _handleMouseLeave() {
        clearTimeout(this.timeout);
        this.refs[this.key].style.opacity = 0;
        this.refs[this.key].classList.remove('animate');
    }

    render() {
        return (
            <div className="tooltip-component"
                 onMouseEnter={this._handleMouseEntered.bind(this)}
                 onMouseLeave={this._handleMouseLeave.bind(this)}>
                {this.props.children}
                <span className="tooltip" ref={this.key}>{this.props.content}</span>
            </div>
        );
    }
}

export default Tooltip;
