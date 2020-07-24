const cosmos = require('cosmos-lib');
const logger = require('../common/logger');

async function sleep (time) {
    await new Promise((resolve) => {
        setTimeout(() => resolve(true), time);
    });
}

/**
 * Checksum the address
 */
function isValidCosmosAddress (address) {
    if (!address.startsWith("secret")) {
        logger.error(`address=${address} has invalid prefix`)
        return false;
    }
    try {
        cosmos.address.getBytes32(address);
        return true;
    } catch (error) {
        logger.error(error);
    }
    return false;
}

module.exports = {
    sleep, isValidCosmosAddress
};
