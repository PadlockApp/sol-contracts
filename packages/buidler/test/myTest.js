const { BN, expectRevert, balance, expectEvent, ether, send } = require('@openzeppelin/test-helpers');
const Padlock = artifacts.require("Padlock");
const PadlockNFT = artifacts.require("PadlockNFT");
const PaymentToken = artifacts.require("PaymentToken");
describe("Padlock dApp", function() {

  let accounts;
  let padlockContract;
  let paymentContract;
  let nftContract;
  let buyer;
  let owner;
  const hash = "test";
  const desc = "a thing";
  const secretRecipient = "secret18acg8ylf9ppgnzqszx0qg5aww53qayrwfh0q0v";
  const id = "1";
  const orderId = "1";
  const price = ether("1");
  
  before(async function() {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    creator = accounts[1];
    buyer = accounts[2];

  });
  
  describe("Padlock", function() {
    const amount = ether("1000");

    it("Should deploy PaymentContract", async function() {
      paymentContract = await PaymentToken.new('Acme', 'ACME');
      await paymentContract.mint(buyer, amount);
    });
    it("Should deploy Padlock", async function() {
      padlockContract = await Padlock.new(paymentContract.address);
    });
    it("Should deploy PadlockNFT", async function() {
      nftContract = await PadlockNFT.new('PadlockNFT', 'PAD', padlockContract.address);
      await padlockContract.setNftContract(nftContract.address);
    });
    describe("owner()", function() {
      it("Should have an owner equal to the deployer", async function() {
        assert.equal(await padlockContract.owner(), owner);
      });
    });
    describe("create()", function() {
      it("Price too low", async function() {
        expectRevert(padlockContract.create(hash, desc, ether("0.99")), "Price too low");
      });

      it("Should create item", async function() {
        const receipt = await padlockContract.create(hash, desc, price, {from: creator});
        expectEvent(receipt, 'Created', {
          creator: creator,
          hash: hash,
          description: desc,
          price: price,
          id: id
        });
      });
    });
    describe("order()", function() {
      it("Should order item", async function() {
        await paymentContract.approve(padlockContract.address, amount, {from: buyer});
        expect(await paymentContract.allowance(buyer, padlockContract.address)).to.be.bignumber.equal(amount);

        let receipt = await padlockContract.order(id, secretRecipient, {from: buyer});
        expectEvent(receipt, 'NewOrder', {
          creator: creator,
          buyer: buyer,
          hash: hash,
          description: desc,
          price: price,
          id: id,
          recipient: secretRecipient,
          orderId: orderId
        });
      });

      it("should mint token", async function() {
        const key = "secret sauce";
        receipt = await padlockContract.completePurchase(
          orderId, {from: owner});
        expectEvent(receipt, 'Payment', {
          payee: creator, 
          amount: ether("0.99"),
          orderId
        });
      });
    });
  });
});
