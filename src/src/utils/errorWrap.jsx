import React from "react";
import ErrorPage from "./errorPage";

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
        console.debug('%c❌ ERROR WRAP | ', 'color:#ff005d',error,errorInfo);
        // console.log("Error caught!");
        // console.error(error);
        // console.error(errorInfo);

        // record the error in an APM tool...
    }

    render() {
        // console.debug('%c⊙WRAPPER ERRCHECK ', 'color:#00ff7b', ":",this.state,this.state.hasError,this.props );
        // if an error occurred
        if (this.state.hasError) {
            console.debug('%c⭗ Has Error Confirmed', 'color:#ff005d',typeof this.state.error  );
            return <ErrorPage errorValue={this.state.error}/>;
        } else {
            // default behavior
            // console.debug('%c⊙', 'color:#00ff7b', "Err Not confired" );
            return this.props.children;
        }
    }
}