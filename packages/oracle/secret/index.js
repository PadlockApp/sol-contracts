const logger = require('../common/logger');
const { EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey } = require("secretjs");
const { isValidCosmosAddress } = require('../common/utils');
const config = require('../common/config');

const mnemonic = config.secretMnemonic;
const contractAddress = config.secretContract;

const secretOptions = {
    httpUrl: "http://localhost:1317",
    networkId: "enigma-testnet",
    feeToken: "uscrt",
    gasPrice: 0.025,
    bech32prefix: "secret",
}

const customFees = {
  upload: {
    amount: [{ amount: "25000", denom: "uscrt" }],
    gas: "2000000",
  },
  init: {
    amount: [{ amount: "0", denom: "uscrt" }],
    gas: "500000",
  },
  exec: {
    amount: [{ amount: "0", denom: "uscrt" }],
    gas: "500000",
  },
  send: {
    amount: [{ amount: "2000", denom: "uscrt" }],
    gas: "80000",
  },
}

/**
 * Whitelists an address.
 */
async function whitelistAddress (address) {
    logger.info(`whitelisting ${address}`)
    if (!isValidCosmosAddress(address)) {
        throw new Error(`address=${address} is invalid`)
    }

    const whitelistMsg = {"WhitelistAddress": {"address": address}}
    const client = await getClient()
    let result = await client.execute(contractAddress, whitelistMsg);
    console.log(`Whitelisted address: ${JSON.stringify(result)}`);
}

async function getClient() {
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);
        const myWalletAddress = pubkeyToAddress(
        encodeSecp256k1Pubkey(signingPen.pubkey),
        "secret"
        );
    logger.info(`myWalletAddress=${myWalletAddress}`)
    const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
    const client = new SigningCosmWasmClient(
        secretOptions.httpUrl,
        myWalletAddress,
        (signBytes) => signingPen.sign(signBytes),
        txEncryptionSeed, customFees
    );
    return client;
}

module.exports = {
    whitelistAddress
};
