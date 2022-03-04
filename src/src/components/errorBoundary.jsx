import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {error: ""};
  }

  componentDidCatch(error) {
    console.debug("componentDidCatch",error);
    this.setState({error: `${error.name}: ${error.message}`});
  }

  render() {
    const {error} = this.state;
    if (error) {
      return (
        <div>ERROR {error}</div>
      );
    } else {
      return <>{this.props.children}</>;
    }
  }
}
