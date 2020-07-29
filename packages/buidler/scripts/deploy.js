const fs = require('fs');
const { ether } = require('@openzeppelin/test-helpers');

const chalk = require('chalk');
async function main() {
  console.log("📡 Deploy ... \n")
  // auto deploy to read contract directory and deploy them all (add ".args" files for arguments)
  // await autoDeploy();
  // OR
  // custom deploy (to use deployed addresses dynamically for example:)
  await deploy("Attestor");
  
  const paymentToken = await deploy("PaymentToken", ['PadlockPayment', 'TEST']);
  const amount = ether("10000000000000");
  await paymentToken.mint('0xc783df8a850f42e7F7e57013759C285caa701eB6', amount);
  const padlock = await deploy("Padlock", [paymentToken.address]);
  const padlockNFT = await deploy("PadlockNFT", ['PadlockNFT', 'PAD', padlock.address]);
  padlock.setNftContract(padlockNFT.address);
  
}
main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});


async function deploy(name,_args){
  let args = []
  if(_args){
    args = _args
  }
  console.log("📄 "+name)
  const contractArtifacts = artifacts.require(name);
  const contract = await contractArtifacts.new(...args)
  console.log(chalk.cyan(name),"deployed to:", chalk.magenta(contract.address));
  fs.writeFileSync("artifacts/"+name+".address",contract.address);
  console.log("\n")
  return contract;
}

async function autoDeploy() {
  let contractList = fs.readdirSync("./contracts")
  for(let c in contractList){
    if(contractList[c].indexOf(".sol")>=0 && contractList[c].indexOf(".swp.")<0){
      const name = contractList[c].replace(".sol","")
      let args = []
      try{
        const argsFile = "./contracts/"+name+".args"
        if (fs.existsSync(argsFile)) {
          args = JSON.parse(fs.readFileSync(argsFile))
        }
      }catch(e){
        console.log(e)
      }
      await deploy(name,args)
    }
  }
}
