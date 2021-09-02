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
    constructor(props) {
        super(props);
        console.debug("Routes props",props)
    }

    componentDidMount() {    
        console.debug("Router componentDidMount ",this.props);

    }
    render() {
        return (
            <Router history={history}>
                <Switch>
                    <Route path="/new/:test" exact>
                        <SearchComponent 
                            fromRoute="nmew" 
                        />
                    </Route> 
                    <Route path="/:type/:uuid" component={SearchComponent} />
                    <Route
                        path='/:type'
                        render={(props) => (
                            <SearchComponent {...props} />
                            )}
                    />
                    {/* <Route path="/:type" component={SearchComponent} /> */}
                    <Route path="/err-response" component={ErrorPage} />
                            <Route path="/" exact component={SearchComponent} /> 
                </Switch>
            </Router>
        )
    }
}