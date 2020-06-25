import React, { Component } from "react";
import { Router, Switch, Route, useParams } from "react-router-dom";
import EntityList from "./components/uuid/entityList";
import DonorForm from "./components/uuid/donor_form_components/donorForm";
import TissueForm from "./components/uuid/tissue_form_components/tissueForm";
import DataList from "./components/ingest/datalist";
import DatasetEdit from "./components/ingest/dataset_edit";
import NewDatasetModal from "./components/ingest/newDatasetModal";
import Collections from "./Collections/Collections";
import Collection from "./Collections/Collection";
import ErrorPage from './utils/error_page';
//import Samples from "./Samples/Samples";
//import Datasets from "./Datasets/Datasets";
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