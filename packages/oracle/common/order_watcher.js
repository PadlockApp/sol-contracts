/* eslint-disable no-underscore-dangle,no-await-in-loop */
const Web3 = require('web3');
const Padlock = require('../../buidler/artifacts/Padlock.json');
const { sleep, isValidCosmosAddress } = require('./utils');
const logger = require('./logger');
var fs = require('fs');
var path = require('path');
const PadlockAddressPath = '../../buidler/artifacts/Padlock.address';
const latestAddress = fs.readFileSync(path.resolve(__dirname, PadlockAddressPath));
const ropstenAddress = "0x3BC0dA3De7a121516B62F4b9349CeFf3103D006a";
/**
 * @typedef {Object} Order
 * @property {string} buyer - eth address of buyer
 * @property {string} hash - content hash
 * @property {string} description - description of the content
 * @property {string} id - The item ordered
 * @property {string} transactionHash - The transaction hash associated with the receipt
 */

class OrderWatcher {
    constructor (provider, networkId, nbConfirmations = 0, fromBlock = 0, pollingInterval = 1000) {
        this.web3 = new Web3(provider);
        let padlockAddress = networkId === "3" ? ropstenAddress : latestAddress;
        logger.info(`padlockAddress=${padlockAddress}`)
        this.fromBlock = fromBlock;
        this.padlockContract = new this.web3.eth.Contract(
            Padlock.abi,
            padlockAddress
        );
        this.watching = false;
        this.pollingInterval = pollingInterval;
        this.nbConfirmations = nbConfirmations;
    }

    /**
     * Watch the chain and yield for each Order event
     * @returns {AsyncGenerator<Order, void, ?>}
     */
    async * watchOrderLog () {
        logger.info('Watching for orders');
        this.watching = true;
        do {
            const currentBlock = await this.web3.eth.getBlockNumber();
            // Delay reading events by N confirmations (block numbers)
            // Using the default 'latest' would emit events that could be reverted in a reorg
            const toBlock = (this.nbConfirmations === 0) ? currentBlock : currentBlock - this.nbConfirmations;
            const evts = await this.padlockContract.getPastEvents('Order', {
                fromBlock: this.fromBlock,
                toBlock
            });
            if (this.nbConfirmations > 0) {
                logger.info('Delayed query with confirmations');
            }
            logger.info(`Got [${evts.length}] events`);
            for (const evt of evts) {
                const blockPosition = evt.blockNumber;
                // Always greater than 0 on mainnet
                this.fromBlock = ((blockPosition > 0) ? blockPosition : 0) + 1;

                logger.info(`evt=${JSON.stringify(evt)}`)
                logger.info(`returnValues=${JSON.stringify(evt.returnValues)}`)

                const logOrder = {
                    transactionHash: evt.transactionHash,
                    recipient: evt.returnValues.recipient,
                    id: evt.returnValues.id,
                    description: evt.returnValues.description,
                    buyer: Web3.utils.toChecksumAddress(evt.returnValues.buyer),
                    creator: evt.returnValues.creator,
                    hash: evt.returnValues.hash
                };
                yield logOrder;
            }
            // eslint-disable-next-line no-await-in-loop
            await sleep(this.pollingInterval);
        } while (this.watching);
    }

    /**
     * Stop polling for events
     */
    stop () {
        this.watching = false;
    }
}

module.exports = { OrderWatcher };
