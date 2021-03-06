import {encrypt, decrypt} from 'eccrypto'
import { publicKeyConvert} from 'secp256k1';

/**
* @method encryptWithPublicKey
* @param {String} pubKey - Compressed 33byte public key starting with 0x03 or 0x02
* @param {Object} message - message object to encrypt
* @returns {String} - Stringified cipher
*/
function encryptWithPublicKey(pubKey, message) {
    pubKey = pubKey.substring(2)
    pubKey = publicKeyConvert(new Buffer(pubKey, 'hex'), false).toString('hex')
    pubKey = new Buffer(pubKey, 'hex')
    return encrypt(
        pubKey,
        Buffer(message)
    ).then(encryptedBuffers => {
        const cipher = {
            iv: encryptedBuffers.iv.toString('hex'),
            ephemPublicKey: encryptedBuffers.ephemPublicKey.toString('hex'),
            ciphertext: encryptedBuffers.ciphertext.toString('hex'),
            mac: encryptedBuffers.mac.toString('hex')
        };
        // use compressed key because it's smaller
        const compressedKey = publicKeyConvert(new Buffer(cipher.ephemPublicKey, 'hex'), true).toString('hex')

        const ret = Buffer.concat([
            new Buffer(cipher.iv, 'hex'), // 16bit
            new Buffer(compressedKey, 'hex'), // 33bit
            new Buffer(cipher.mac, 'hex'), // 32bit
            new Buffer(cipher.ciphertext, 'hex') // var bit
        ]).toString('hex')
        
        return ret
    });
}

/**
* @method decryptWithPrivateKey decript an EC publicKey encrypted message with the associated private key
* @param {String} privateKey - the privatekey to decrypt with, including '0x' prefix
* @param {String} encrypted - the stringified cipher to decrypt
* @returns {Object} - the decrypted message
*/

function decryptWithPrivateKey(privateKey, encrypted) {
    const buf = new Buffer(encrypted, 'hex');
    encrypted = {
        iv: buf.toString('hex', 0, 16),
        ephemPublicKey: buf.toString('hex', 16, 49),
        mac: buf.toString('hex', 49, 81),
        ciphertext: buf.toString('hex', 81, buf.length)
    };
    // decompress publicKey
    encrypted.ephemPublicKey = publicKeyConvert(new Buffer(encrypted.ephemPublicKey, 'hex'), false).toString('hex')
    const twoStripped = privateKey.substring(2)
    const encryptedBuffer = {
        iv: new Buffer(encrypted.iv, 'hex'),
        ephemPublicKey: new Buffer(encrypted.ephemPublicKey, 'hex'),
        ciphertext: new Buffer(encrypted.ciphertext, 'hex'),
        mac: new Buffer(encrypted.mac, 'hex')
    };
    return decrypt(
        new Buffer(twoStripped, 'hex'),
        encryptedBuffer
    ).then(decryptedBuffer => decryptedBuffer.toString());
}

export default { encryptWithPublicKey, decryptWithPrivateKey }

// var publickey = 0x03bf994adecf618d88331b60678e8d69b99d955caef880edf96f25673c1fb93617
// var privateKey = 0xcad60fb708a017f0a08a02dca1b177fc3926ce4caa6eb3823686cbffd07fbd59
// var message = "I love cupcakes, very very much"
// var encrypted = encryptWithPublicKey(publickey, message)
// var decrypted = decryptWithPrivateKey(privateKey, encrypted)
// console.log(`decrypted=${decrypted}`)