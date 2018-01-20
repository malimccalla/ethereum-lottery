const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });

  lottery.setProvider(provider);
});

describe('Lottery', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('has a manager same as the creator', async () => {
    const manager = await lottery.methods.manager().call();
    assert.equal(manager, accounts[0]);
  });

  it('allows one acccount to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('2', 'ether'),
    });
    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(1, players.length);
    assert.equal(accounts[1], players[0]);
  });

  it('allows multiple acccounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('2', 'ether'),
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('2', 'ether'),
    });

    await lottery.methods.enter().send({
      from: accounts[3],
      value: web3.utils.toWei('2', 'ether'),
    });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(3, players.length);
    assert.equal(accounts[1], players[0]);
    assert.equal(accounts[2], players[1]);
    assert.equal(accounts[3], players[2]);
  });

  it('doesnt allow you to enter with less than 2 ether', async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[1],
        value: web3.utils.toWei('1', 'ether'),
      });
      assert(false);
    } catch (e) {
      const players = await lottery.methods
        .getPlayers()
        .call({ from: accounts[0] });

      assert(e);
      assert.equal(0, players.length);
    }
  });

  it('the manager can pick a winner', async () => {
    const initialBalance = await web3.eth.getBalance(accounts[1]);

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('2', 'ether'),
    });

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });

    const finalBalance = await web3.eth.getBalance(accounts[1]);
    const gas = initialBalance - finalBalance;
    const expectedBalance = parseInt(gas) + parseInt(finalBalance);

    assert.equal(expectedBalance.toString(), initialBalance);
  });

  it('only the manager can pick a winner', async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (e) {
      assert(e);
    }
  });

  it('resets players array after picking winner', async () => {
    const initialBalance = await web3.eth.getBalance(accounts[1]);

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('2', 'ether'),
    });

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(0, players.length);
  });
});
