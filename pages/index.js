import React, { Component } from 'react';

class Index extends Component {
  state = {
    web3: null,
    manager: '',
    players: [],
    balance: '',
    value: '',
    message: '',
  };

  async componentDidMount() {
    const web3 = require('../lib/web3').default;
    const lottery = require('../lib/lottery').default;

    const manager = await lottery.methods.manager().call();
    const players = await lottery.methods.getPlayers().call();
    const balance = await web3.eth.getBalance(lottery.options.address);
    const enter = lottery.methods.enter();
    const pickWinner = lottery.methods.pickWinner();

    this.setState({ web3, manager, players, balance, enter, pickWinner });
  }

  onSubmit = async e => {
    e.preventDefault();
    const { lottery, web3, value, enter } = this.state;
    const accounts = await web3.eth.getAccounts();

    this.setState({ message: 'Waiting on transaction....' });

    await enter.send({
      value: web3.utils.toWei(value, 'ether'),
      from: accounts[0],
    });

    this.setState({ message: 'You have success entered the lottery' });
  };

  pickWinner = async () => {
    const { pickWinner, web3 } = this.state;
    const accounts = await web3.eth.getAccounts();

    this.setState({ message: 'picking winner.... ' });

    try {
      await pickWinner.send({ from: accounts[0] });
      this.setState({ message: 'Winner was chosen!' });
    } catch (e) {
      console.log('eeeeee', e);
      this.setState({ message: 'Only the manager can pick a winner' });
    }
  };

  render() {
    const { manager, web3, players, balance, value, message } = this.state;
    if (!web3) return null;

    return (
      <div>
        <h2>Lottery Contract</h2>
        <p>
          Contract managed by: {manager} <br />
          There are {players.length} people currently entered
          <br />
          Prize pool is currently {web3.utils.fromWei(balance, 'ether')} ether!
        </p>
        <hr />
        <form onSubmit={this.onSubmit}>
          <h4>Enter the lottery</h4>
          <div>
            <label>Amount of ether to enter</label>
            <input
              type="text"
              onChange={e => this.setState({ value: e.target.value })}
              value={value}
            />
          </div>
          <button>Enter</button>
        </form>
        <hr />

        <h4>Pick a winner</h4>
        <button onClick={this.pickWinner}>Pick winner</button>
        <hr />
        <h1>{message}</h1>
      </div>
    );
  }
}

export default Index;
