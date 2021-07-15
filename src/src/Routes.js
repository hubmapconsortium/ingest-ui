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
                    {/* Main pages */}
                    <Route path="/" component={SearchComponent} />
                    <Route path="/search" component={SearchComponent} />
                    <Route path="/err-response" component={ErrorPage} />

                    {/* pre-filtered search results by type */}
                    <Route path="/samples"  render={() => <SearchComponent test="FNORD" />} />
                    <Route path="/datasets" component={SearchComponent} />
                    <Route path="/donors" component={SearchComponent} />
                    <Route path="/uploads" component={SearchComponent} />
                    <Route path="/collections" component={Collections} />

                    {/* Individual Entity VIews */}
                    <Route path="/sample/:uuid" component={SearchComponent} />
                    <Route path="/dataset/:uuid" component={SearchComponent} /> 
                    <Route path="/donor/:uuid" component={SearchComponent} />
                    <Route path="/upload/:uuid" component={SearchComponent} /> 
                    <Route path="/collection/:uuid" component={Collection} />

                   {/*} <Route path="/donors-samples" exact component={UUIDEntrance} />
                    <Route path="/datasets" exact component={IngestEntrance} />*/}
                </Switch>
            </Router>
        )
    }
}