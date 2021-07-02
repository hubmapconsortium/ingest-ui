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



import DonorForm from "./components/uuid/donor_form_components/donorForm";

export default class Routes extends Component {
    render() {
        return (
            <Router history={history}>
                <Switch>
                    {/* Home Search page */}
                    <Route path="/Home" exact component={Home} /> 
                    <Route path="/search" component={SearchComponent} />
                    <Route path="/" component={SearchComponent} />

                    {/* Samples */}
                    <Route path="/sample/:uuid" component={TissueForm} />

                    {/* Collections */}
                    <Route path="/collections/:uuid" component={Collection} />
                    <Route path="/collections" component={Collections} />

                    {/* Specifici Entities */}
                    <Route path="/entity/:uuid" component={SearchComponent} />

                    {/* Donors, Samples, Datasets, and Uploads pre-filtered */}
                    <Route path="/donors" component={SearchComponent} filter="donors" />
                    <Route path="/samples" component={SearchComponent} filter="samples" />
                    <Route path="/datasets" component={SearchComponent} filter="datasets" />
                    <Route path="/uploads" component={SearchComponent} filter="uploads" />
                    
                    {/* Creation forms */}
                    <Route path="/new/donors" component={DonorForm} />
                    <Route path="/new/samples" component={SearchComponent} />
                    <Route path="/new/datasets" component={SearchComponent} />
                    <Route path="/new/uploads" component={SearchComponent} />


                    {/* System */}
                    <Route path="/err-response" component={ErrorPage} />


                </Switch>
            </Router>
        )
    }
}