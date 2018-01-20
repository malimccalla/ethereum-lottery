import React, { Component } from 'react';

class Index extends Component {
  state = { web3: null };

  componentDidMount() {
    const web3 = require('../lib/web3').default;
    this.setState({ web3 });
  }

  render() {
    const { web3 } = this.state;
    if (!web3) return null;

    return <h1>{web3.version}</h1>;
  }
}

export default Index;
