import React, { useState, useEffect } from 'react'
import 'antd/dist/antd.css';
import { ethers } from "ethers";
import "./App.css";
import { Row, Col, Input, Button, Spin, Typography } from 'antd';
import { Transactor } from "./helpers"
import { useExchangePrice, useGasPrice, useContractLoader, useContractReader } from "./hooks"
import { Header, Account, Provider, Faucet, Ramp, Address, Contract } from "./components"
const { TextArea } = Input;
const { BufferList } = require('bl')
const { encrypt, decrypt } = require("eccrypto");
const { publicKeyConvert} = require("secp256k1");
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

  // todo get from secret contract
const publickey = '0x04a8873dd159b2c241dcf56ff4baa59e84cc0124844340d6eec7b7f8fd795a921a7e5fc50298aa728ba9fe4561dd99cb2d52e6267a8e0549ccf34ca767b6593ab8';
const privateKey = '0x7934533cd797cfe47d7b5c43ddcf80ee1605aa2d209137bbf1c8b5bb4003f194';

const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path)
    if (!file.content) continue;
    const content = new BufferList()
    for await (const chunk of file.content) {
      content.append(chunk)
    }
    console.log(content)
    return content
  }
}

const addToIPFS = async fileToUpload => {

  const data = await encryptWithPublicKey(publickey, fileToUpload);
  
  for await (const result of ipfs.add(data)) {
    return result
  }
}

/**
* @method encryptWithPublicKey
* @param {String} pubKey - Compressed 33byte public key starting with 0x03 or 0x02
* @param {Object} message - message object to encrypt
* @returns {String} - Stringified cipher
*/
async function encryptWithPublicKey(pubKey, message) {
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

async function decryptWithPrivateKey(privateKey, encrypted) {
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

const mainnetProvider = new ethers.providers.InfuraProvider("mainnet","2717afb6bf164045b5d5468031b93f87")
const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

function App() {

  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const price = useExchangePrice(mainnetProvider)
  const gasPrice = useGasPrice("fast")

  const tx = Transactor(injectedProvider,gasPrice)

  const readContracts = useContractLoader(localProvider);
  const writeContracts = useContractLoader(injectedProvider);

  const myAttestation = useContractReader(readContracts,"Attestor","attestations",[address],1777);

  const [ data, setData ] = useState()
  const [ metadataHash, setMetadataHash ] = useState()
  const [ sending, setSending ] = useState()
  const [ ipfsHash, setIpfsHash ] = useState()
  const [ ipfsContents, setIpfsContents ] = useState()
  const [ decryptedIpfsContents, setDecryptedIpfsContents ] = useState()
  const [ attestationContents, setAttestationContents ] = useState()

  const asyncGetFile = async ()=>{
    let result = await getFromIPFS(ipfsHash)


   // test decrypt
    const decrypted = await decryptWithPrivateKey(privateKey, result.toString());
    setDecryptedIpfsContents(decrypted)
    setIpfsContents(result.toString())
  }

  useEffect(()=>{
    if(ipfsHash) asyncGetFile()
  },[ipfsHash])

  let ipfsDisplay = ""
  if(ipfsHash){
    if(!ipfsContents){
      ipfsDisplay = (
        <Spin />
      )
    }else{
      ipfsDisplay = (
        <div>
          <Typography>Encrypted data from IPFS:</Typography>
          <pre style={{margin:8,padding:8,border:"1px solid #dddddd",backgroundColor:"#ededed"}}>
            {ipfsContents}
          </pre>
          <Typography>Decrypted:</Typography>
          <pre style={{margin:8,padding:8,border:"1px solid #dddddd",backgroundColor:"#ededed"}}>
            {decryptedIpfsContents}
          </pre>
        </div>
      )
    }
  }

  const asyncGetAttestation = async ()=>{
    let result = await getFromIPFS(myAttestation)
    setAttestationContents(result.toString())
  }

  useEffect(()=>{
    if(myAttestation) asyncGetAttestation()
  },[myAttestation])


  let attestationDisplay = ""
  if(myAttestation){
    if(!attestationContents){
      attestationDisplay = (
        <Spin />
      )
    }else{
      attestationDisplay = (
        <div>
          <Address value={address} /> attests to:
          <pre style={{margin:8,padding:8,border:"1px solid #dddddd",backgroundColor:"#ededed"}}>
            {attestationContents}
          </pre>
        </div>

      )
    }
  }

  return (
    <div className="App">
      <Header />
      <div style={{position:'fixed',textAlign:'right',right:0,top:0,padding:10}}>
        <Account
          address={address}
          setAddress={setAddress}
          localProvider={localProvider}
          injectedProvider={injectedProvider}
          setInjectedProvider={setInjectedProvider}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      </div>

      <div style={{padding:32,textAlign: "left"}}>
        Enter a bunch of data:
        <TextArea rows={10} value={data} onChange={(e)=>{
          setData(e.target.value)
        }} />
        <Button disabled={!data} style={{margin:8}} loading={sending} size="large" shape="round" type="primary" onClick={async()=>{
          console.log("UPLOADING...")
          setSending(true)
          setIpfsHash()
          setIpfsContents()
          const result = await addToIPFS(data)
          if(result && result.path) {
            setIpfsHash(result.path)
          }
          setSending(false)
          console.log("RESULT:",result)
        }}>Upload to IPFS</Button>
      </div>

      <div style={{padding:32,textAlign: "left"}}>
        IPFS Hash: <Input value={ipfsHash} onChange={(e)=>{
          setIpfsHash(e.target.value)
        }} />
        {ipfsDisplay}

        Metadata Hash: <Input value={metadataHash} onChange={(e)=>{
          setMetadataHash(e.target.value)
        }} />

        <Button disabled={!ipfsHash || !metadataHash} style={{margin:8}} size="large" shape="round" type="primary" onClick={async()=>{
          const itemPrice = ethers.utils.parseEther("1.0").toString();
          debugger
          tx( writeContracts["Padlock"].create(ipfsHash, metadataHash, itemPrice))
        }}>Create item for sale</Button>
      </div>

      <div style={{padding:32,textAlign: "left"}}>
        {attestationDisplay}
      </div>

      <div style={{position:'fixed',textAlign:'left',left:0,bottom:20,padding:10}}>
        <Row align="middle" gutter={4}>
          <Col span={9}>
            <Ramp
              price={price}
              address={address}
            />
          </Col>
          <Col span={15}>
            <Faucet
              localProvider={localProvider}
              price={price}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
