import React, { Component } from "react";
import { Router, Switch, Route } from "react-router-dom";
import Collections from "./Collections/Collections";
import Collection from "./Collections/Collection";
import ErrorPage from './utils/error_page';
import Home from "./Home/Home";
import history from './history';

export default class Routes extends Component {
    render() {
        return (
            <Router history={history}>
                <Switch>
                   <Route path="/Home" exact component={Home} /> 
                   {/**  <Route path="/Samples" component={EntityList} />
                    <Route path="/Donor" component={DonorForm} />
                    <Route path="/Sample" component={TissueForm} />
                    <Route path="/Datasets" component={DataList} />
                    <Route path="/Dataset" component={DatasetEdit} /> */}  
                    <Route path="/collections/:uuid" component={Collection} />
                    <Route path="/collections" component={Collections} />
                    <Route path="/err-response" component={ErrorPage} />
                </Switch>
            </Router>
        )
    }
}