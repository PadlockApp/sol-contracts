// config.js
require('dotenv').config();
const convict = require('convict');

const config = convict({
    env: {
        format: ['prod', 'dev', 'test'],
        default: 'prod',
        arg: 'nodeEnv',
        env: 'NODE_ENV'
    },
    networkId: {
        format: String,
        default: '1',
        arg: 'NETWORK_ID',
        env: 'NETWORK_ID'
    },
    pollingInterval: {
        format: Number,
        default: 30000,
        arg: 'POLLING_INTERVAL',
        env: 'POLLING_INTERVAL'
    },
    ethProviderUrl: {
        format: String,
        default: 'http://localhost:8545',
        arg: 'ethProviderUrl',
        env: 'ETH_PROVIDER'
    },
    fromBlock: {
        format: Number,
        default: 0,
        arg: 'fromBlock',
        env: 'FROM_BLOCK'
    },
    nbConfirmations: {
        format: String,
        default: '12',
        arg: 'nbConfirmations',
        env: 'NB_CONFIRMATIONS'
    },
});

const env = config.get('env');
config.loadFile(`./config/${env}.json`);

config.validate({ allowed: 'strict' }); // throws error if config does not conform to schema
console.log(`config=${config.toString()}`)

module.exports = config.getProperties();