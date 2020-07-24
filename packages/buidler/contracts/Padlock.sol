pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import "@nomiclabs/buidler/console.sol";
import "./PadlockNFT.sol";

contract Padlock is Context, AccessControl, Ownable {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  using SafeERC20 for ERC20;
  using SafeMath for uint256;

  struct Creation {
      address creator;
      string hash;
      string description;
      uint256 price;
  }

  uint256 public minPrice = 1 ether;
  uint256 public commission = 1; // fixed percent
  uint256 public numCreations = 0;
  address public paymentContract;
  address public nftContract;

  mapping (uint256 => Creation) public creations;

  constructor(address initPaymentContract) public {
      _setupRole(MINTER_ROLE, _msgSender());
      _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
      paymentContract = initPaymentContract;
      
  }
  
  //todo move to factory or something
  function setNftContract(address initNftContract) public onlyOwner {
    nftContract = initNftContract;
  }

  function create(string memory hash, string memory description, uint256 price) public {
    require(price >= minPrice, "Price too low");
    console.log(msg.sender, hash, description, price);
    creations[++numCreations] = Creation(msg.sender, hash, description, price);
    emit Created(msg.sender, hash, description, numCreations, price);
  }

  function order(uint256 id, string memory recipient) public {
    // todo validate receipient]
    require(id <= numCreations, "Item does not exist");
    Creation memory creation = creations[id];
    uint256 price = creation.price;
    require(ERC20(paymentContract).balanceOf(_msgSender()) >= price, "Insufficient balance");
    require(ERC20(paymentContract).allowance(_msgSender(), address(this)) >= price, "Payment not approved");
    require(ERC20(paymentContract).transferFrom(_msgSender(), address(this), price), "Failed to deposit");
    emit Order(msg.sender, creation.creator, creation.hash, creation.description, id, price, recipient);
  }

  /// completes the purchase, minting an NFT for the new owner.
  function completePurchase(uint256 id, address buyer, string memory decryptionKey) public {
    require(hasRole(MINTER_ROLE, _msgSender()), "Must have minter role to mint");
    Creation memory creation = creations[id];
    uint256 price = creation.price;
    uint256 commissionAmount = price.mul(commission) / 100;
    uint256 payment = price - commissionAmount;
    console.log("purchase", commissionAmount, payment);
    
    require(ERC20(paymentContract).transfer(owner(), commissionAmount), "Failed to transfer commission");
    require(ERC20(paymentContract).transfer(creation.creator, payment), "Failed to transfer payment");

    PadlockNFT(nftContract).mint(buyer, id);
    
    emit Purchased(buyer, creation.creator, creation.hash, creation.description, id, price);
    emit Payment(creation.creator, payment);
    emit Payment(owner(), commissionAmount);
  }

  event Created(address indexed creator, string hash, string description, uint256 indexed id, uint256 price);
  event Purchased(address indexed buyer, address indexed creator, string hash, string description, uint256 indexed id, uint256 price);
  event Order(address indexed buyer, address indexed creator, string hash, string description, uint256 indexed id, uint256 price, string recipient);
  event PaymentContractChanged(address indexed paymentContract);
  event Payment(address indexed payee, uint256 amount);
}
