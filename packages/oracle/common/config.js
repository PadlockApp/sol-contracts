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
    oracleEthKey: {
        format: String,
        default: '',
        sensitive: true,
        arg: 'oracleEthKey',
        env: 'ORACLE_ETH_KEY'
    },
    oracleEthAddress: {
        format: String,
        default: '',
        arg: 'oracleEthAddress',
        env: 'ORACLE_ETH_ADDRESS'
    },
    secretContract: {
        format: String,
        default: '',
        arg: 'secretContract',
        env: 'SECRET_CONTRACT'
    },
    secretMnemonic: {
        format: String,
        default: '',
        sensitive: true,
        arg: 'secretMnemonic',
        env: 'SECRET_MNEMONIC'
    },
    ethContractAddress: {
        format: String,
        default: '',
        arg: 'ethContractAddress',
        env: 'ETH_CONTRACT_ADDRESS'
    }
});

const env = config.get('env');
config.loadFile(`./config/${env}.json`);

config.validate({ allowed: 'strict' }); // throws error if config does not conform to schema
console.log(`config=${config.toString()}`)

module.exports = config.getProperties();