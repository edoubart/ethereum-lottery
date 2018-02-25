const Web3 = require('web3');
const assert = require('assert');
const ganache = require('ganache-cli');
const { bytecode, interface } = require('../compile');

const provider = ganache.provider();
const web3 = new Web3(provider);

const GAS = '1000000';

describe('Lottery Contract', () => {
  let accounts;
  let lottery;

  beforeEach(async () => {
    // Get a list of all accounts.
    accounts = await web3.eth.getAccounts();

    // Use one of those accounts to deploy the contract.
    lottery = await new web3.eth.Contract(JSON.parse(interface))  // Teaches web3 about what methods an Inbox contract has.
      .deploy({ data: bytecode })                                 // Tells web3 that we want to deploy a new copy of this contract.
      .send({ from: accounts[0], gas: GAS });                     // Instructs web3 to send out a transaction that creates this contract.

    lottery.setProvider(provider);
  });

  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('allows multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it('requires a minimum amount of ether to enter', async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 0
      });

      assert(false); // Tells test to fail.
    } catch (error) {
      assert(error);
    }
  });

  it('only manager can pick a winner', async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      });

      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it('sends money to the winner, resets the players array and the lottery', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether')
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });
    const lotteryBalance = await web3.eth.getBalance(lottery.options.address);

    assert(difference > web3.utils.toWei('1.8', 'ether'));
    assert.equal(players.length, 0);
    assert.equal(lotteryBalance, 0);
  });
});
