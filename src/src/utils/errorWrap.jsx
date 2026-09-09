import React from "react";
import ErrorPage from "./errorPage";
import { logger } from "./logger";

export default class StandardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);

        // to keep track of when an error occurs
        // and the error itself
        this.state = {hasError:false,
            error:   undefined};
    }

    // update the component state when an error occurs
    static getDerivedStateFromError(error) {
        // specify that the error boundary has caught an error
        return {hasError:true,
            error:   error};
    }

    // defines what to do when an error gets caught
    componentDidCatch(error, errorInfo) {
        // log the error
        console.error(error?error:"Uncaptured",errorInfo?errorInfo:"No additional info");

        // record the error in an APM tool...
    }

    render() {
        // if an error occurred
        if (this.state.hasError) {
            logger.all.error({message: 'StandardErrorBoundary.render', error_details: this.state.error})
            return <ErrorPage errorValue={this.state.error}/>;
        } else {
            // default behavior
            return this.props.children;
        }
    }
}
