
const { sleep } = require('./common/utils');
const { OrderWatcher } = require('./common/order_watcher');
const logger = require('./common/logger');
const { whitelistAddress } = require('./secret')
const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx').Transaction

class PadlockAccess {
    /**
     * For each Order event on Ethereum
     *
     * @param provider
     * @param networkId
     * @param nbConfirmation
     * @param fromBlock
     * @param pollingInterval
     */
    constructor (provider, networkId, padlockContract, padlockAddress, nbConfirmation = 1, 
        fromBlock = 0, pollingInterval = 3000, oracleEthAddress, oracleEthKey, padlockNftContract) {
        this.pollingInterval = pollingInterval;
        this.padlockContract = padlockContract;
        this.padlockAddress = padlockAddress;
        this.orderWatcher = new OrderWatcher(provider, networkId, nbConfirmation, fromBlock, 
            pollingInterval, padlockContract, padlockAddress);
        this.done = false;
        this.oracleEthAddress = oracleEthAddress;
        this.oracleEthKey = oracleEthKey;
        this.web3 = new Web3(provider);
        this.padlockNftContract = padlockNftContract;
    }

    stop () {
        this.orderWatcher.stop();
        this.done = true;
        process.exit(0);
    }

    sendSigned(txData, cb) {
        const privateKey = new Buffer(this.oracleEthKey, 'hex');
        const transaction = new EthereumTx(txData, { chain: 'ropsten'});
        transaction.sign(privateKey);
        const serializedTx = transaction.serialize().toString('hex');
        this.web3.eth.sendSignedTransaction('0x' + serializedTx, cb);
    }

    async run () {
        this.done = false;
        for await (const logOrder of this.orderWatcher.watchOrderLog()) {
            logger.info(`PadlockAccess found Order event: ${JSON.stringify(logOrder)}`);
            const { transactionHash, recipient, orderId } = logOrder;
            try {
                let totalSupply;
                logger.info(`transactionHash=${transactionHash}, transactionHash=${recipient}, ${orderId}`);
                await this.padlockNftContract.methods.totalSupply().call(function(err, res){
                    totalSupply = parseInt(res);
                });

                if (totalSupply >= orderId) {
                    logger.info(`${orderId} already hasAccess`);
                    continue;
                } else {
                    logger.info(`Unlocking access =${orderId}`);
                }
                
                whitelistAddress(recipient)
                logger.info(`Sending from=${this.oracleEthAddress}, to=${this.padlockAddress}`)

                this.web3.eth.getTransactionCount(this.oracleEthAddress).then(txCount => {
                    logger.info(`txCount=${txCount}`)
                    const txData = {
                        nonce: this.web3.utils.toHex(txCount),
                        gasLimit: this.web3.utils.toHex(500000),
                        gasPrice: this.web3.utils.toHex(100e9),
                        to: this.padlockAddress,
                        from: this.oracleEthAddress,
                        value: 0,
                        data: this.padlockContract.methods.completePurchase(orderId).encodeABI()
                    }
                    this.sendSigned(txData, function(err, result) {
                        if (err) return logger.error('Failed to send', err)
                        logger.info(`sent=${result}`)
                    })
                })
                logger.info(`Completed order=${orderId}`)
                // todo 
                await sleep(10000)
            } catch (e) {
                logger.error(e)
                await sleep(10000);
                this.stop();
            }
            if (this.done) {
                logger.info('Stop called. Shutting down PadlockAccess');
                return;
            }
        }
    }
}

module.exports = { PadlockAccess };
