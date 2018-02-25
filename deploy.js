require('dotenv').config();

const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { bytecode, interface } = require('./compile');

const GAS = '1000000';
const NETWORK_URL = 'https://rinkeby.infura.io';

const provider = new HDWalletProvider(
  `${process.env.ACCOUNT_MNEMONIC}`,
  `${NETWORK_URL}/${process.env.NETWORK_ACCESS_TOKEN}`
);

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: GAS });

  console.log('Contract deployed to', result.options.address);
};

deploy();
