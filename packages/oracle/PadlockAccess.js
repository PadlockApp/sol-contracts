
const { sleep } = require('./common/utils');
const { OrderWatcher } = require('./common/order_watcher');
const logger = require('./common/logger');
const { whitelistAddress } = require('./secret')

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
    constructor (provider, networkId, nbConfirmation = 1, fromBlock = 0, pollingInterval = 3000) {
        this.pollingInterval = pollingInterval;
        this.orderWatcher = new OrderWatcher(provider, networkId, nbConfirmation, fromBlock, pollingInterval);
        this.done = false;
    }

    stop () {
        this.orderWatcher.stop();
        this.done = true;
        process.exit(0);
    }

    async run () {
        this.done = false;
        for await (const logOrder of this.orderWatcher.watchOrderLog()) {
            logger.info(`PadlockAccess found Order event: ${JSON.stringify(logOrder)}`);
            const { transactionHash } = logOrder;
            try {
                whitelistAddress('secret18acg8ylf9ppgnzqszx0qg5aww53qayrwfh0q0v')
                logger.info(`do something cool`)
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
