
require('dotenv-defaults').config();
require('dotenv-expand');
require('console-stamp')(console, '[HH:MM:ss.l]');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const myEnv = dotenv.config();
dotenvExpand(myEnv);

const Web3 = require('web3');
const { PadlockAccess } = require('./PadlockAccess');
const { sleep } = require('./common/utils');
const config = require('./common/config');
const logger = require('./common/logger');

var fs = require('fs');
var path = require('path');
const PadlockAddressPath = '../buidler/artifacts/Padlock.address';
const latestAddress = fs.readFileSync(path.resolve(__dirname, PadlockAddressPath));

const padlockAddress = config.networkId === "3" ? config.ethContractAddress : latestAddress;
logger.info(`padlockAddress=${padlockAddress}`)
const provider = new Web3.providers.HttpProvider(config.ethProviderUrl);
const Padlock = require('../buidler/artifacts/Padlock.json');
const PadlockNFT = require('../buidler/artifacts/PadlockNFT.json');

(async () => {
    const web3 = new Web3(provider);
    const padlockContract = new web3.eth.Contract(
        Padlock.abi,
        padlockAddress
    );
    
    let nftContractAddress;
    await padlockContract.methods.nftContract().call(function(err, res){
        nftContractAddress = res;
    });
    const padlockNftContract = new web3.eth.Contract(
        PadlockNFT.abi,
        nftContractAddress
    );
    
    logger.info(`nftContract=${nftContractAddress}, config.oracleEthAddress=${config.oracleEthAddress}, config.oracleEthKey=${config.oracleEthKey}`)
    const padlockAccess = new PadlockAccess(provider, config.networkId,
        padlockContract, padlockAddress, config.nbConfirmations, config.fromBlock, 
        config.pollingInterval, config.oracleEthAddress, config.oracleEthKey,
        padlockNftContract);
    await padlockAccess.run();
})().catch(async (e) => {
    logger.error('Fatal error starting: ', e);
});
