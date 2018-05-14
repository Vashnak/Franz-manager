/**
 * Created by Vashnak on 28/06/17.
 */

import React from 'react';
import {BrowserRouter, Switch, Route, Redirect} from 'react-router-dom';

import Sidenav from './components/sidenav/Sidenav';
import DashboardView from './views/dashboard/Dashboard';
import ClusterView from './views/clusters/Clusters';
import TopicsView from './views/topics/Topics';
import TopicView from './views/topics/topic/Topic';
import ConsumersView from './views/consumers/Consumers';
import ConsumerView from './views/consumers/consumer/Consumer';

const routes = () => {
    return (
        <BrowserRouter>
            <div className="body">
                <Sidenav/>
                <div className="views">
                    <Switch>
                        <Route exact path="/" render={() => {return <Redirect to="/franz-manager/dashboard"/>}}/>
                        <Route exact path="/franz-manager" render={() => {return <Redirect to="/franz-manager/dashboard"/>}}/>
                        <Route exact path="/franz-manager/dashboard" component={DashboardView}/>
                        <Route exact path="/franz-manager/cluster" component={ClusterView}/>
                        <Route exact path="/franz-manager/topics" component={TopicsView}/>
                        <Route exact path="/franz-manager/topics/:topicId" component={TopicView}/>
                        <Route exact path="/franz-manager/consumers" component={ConsumersView}/>
                        <Route exact path="/franz-manager/consumers/:consumerId" component={ConsumerView}/>
                    </Switch>
                </div>
            </div>
        </BrowserRouter>
    );
};

export default routes;