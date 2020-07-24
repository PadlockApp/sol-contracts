
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

const provider = new Web3.providers.HttpProvider(config.ethProviderUrl);

(async () => {
    const padlockAccess = new PadlockAccess(provider, config.networkId,
        config.nbConfirmations, config.fromBlock, config.pollingInterval);
    await padlockAccess.run();
})().catch(async (e) => {
    logger.error('Fatal error starting: ', e);
});
