import React, { Component } from "react";
import { Router, Switch, Route } from "react-router-dom";
import Collections from "./Collections/Collections";
import Collection from "./Collections/Collection";
import ErrorPage from './utils/error_page';
import Home from "./Home/Home";
import history from './history';
import TissueForm from './components/uuid/tissue_form_components/tissueForm';
import SearchComponent from './components/search/SearchComponent';
// import UUIDEntrance from './components/uuid/uuid_entrance';
// import IngestEntrance from './components/ingest/ingest_entrance';
//import DataList from './components/ingest/datalist';

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
                    <Route path="/" component={SearchComponent} /> 
                    <Route path="/sample/:uuid" component={TissueForm} />
                    <Route path="/collections/:uuid" component={Collection} />
                    <Route path="/collections" component={Collections} />
                    <Route path="/err-response" component={ErrorPage} />
                    <Route path="/search" component={SearchComponent} />
                   {/*} <Route path="/donors-samples" exact component={UUIDEntrance} />
                    <Route path="/datasets" exact component={IngestEntrance} />*/}
                </Switch>
            </Router>
        )
    }
}