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

  struct Order {
    uint256 orderId;
    uint256 creationId;
    address buyer;
    string recipient;
  }

  struct Creation {
    uint256 creationId;
    address creator;
    string hash;
    string metadataHash;
    uint256 price;
  }

  uint256 public minPrice = 1 ether;
  uint256 public commission = 1; // fixed percent
  uint256 public numCreations = 0;
  address public paymentContract;
  address public nftContract;
  uint256 public numOrders = 0;

  mapping (uint256 => Creation) public creations;
  mapping (uint256 => Order) public orders;
  mapping (address => Order[]) public buyerSales;
  mapping (address => Order[]) public creatorSales;

  constructor(address initPaymentContract) public {
      _setupRole(MINTER_ROLE, _msgSender());
      _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
      paymentContract = initPaymentContract;
  }
  
  //todo move to factory or something
  function setNftContract(address initNftContract) public onlyOwner {
    nftContract = initNftContract;
  }

  function create(string memory hash, string memory metadataHash, uint256 price) public {
    require(price >= minPrice, "Price too low");
    console.log(msg.sender, hash, metadataHash, price);
    uint256 creationId = ++numCreations;
    creations[creationId] = Creation(creationId, msg.sender, hash, metadataHash, price);
    emit Created(msg.sender, hash, metadataHash, numCreations, price);
  }

  function order(uint256 id, string memory recipient) public {
    // todo validate receipient]
    require(id <= numCreations, "Item not found");
    Creation memory creation = creations[id];
    uint256 price = creation.price;
    uint256 orderId = ++numOrders;
    orders[orderId] = Order(orderId, id, msg.sender, recipient);
    
    require(ERC20(paymentContract).balanceOf(_msgSender()) >= price, "Insufficient balance");
    require(ERC20(paymentContract).allowance(_msgSender(), address(this)) >= price, "Payment not approved");
    require(ERC20(paymentContract).transferFrom(_msgSender(), address(this), price), "Failed to deposit");
    emit NewOrder(msg.sender, creation.creator, creation.hash, creation.metadataHash, id, price, recipient, orderId);
  }
 
  /// completes the purchase, minting an NFT for the new owner.
  function completePurchase(uint256 orderId) public {
    console.log("completePurchase", orderId);
    require(hasRole(MINTER_ROLE, _msgSender()), "Must have minter role to mint");
    require(orderId <= numOrders, "Order not found");
    Order memory order = orders[orderId];
    Creation memory creation = creations[order.creationId];
    uint256 price = creation.price;
    uint256 commissionAmount = price.mul(commission) / 100;
    uint256 payment = price - commissionAmount;
    buyerSales[order.buyer].push(order);
    buyerSales[creation.creator].push(order);
    console.log("purchase", commissionAmount, payment);
    
    require(ERC20(paymentContract).transfer(owner(), commissionAmount), "Failed to transfer commission");
    require(ERC20(paymentContract).transfer(creation.creator, payment), "Failed to transfer payment");

    PadlockNFT(nftContract).mint(order.buyer, orderId);
    emit Purchased(order.buyer, creation.creator, creation.hash, creation.metadataHash, creation.creationId,
      orderId, price);
    emit Payment(creation.creator, payment, orderId);
    emit Payment(owner(), commissionAmount, orderId);
  }

  event Created(address indexed creator, string hash, string metadataHash, uint256 indexed id, uint256 price);
  event Purchased(address indexed buyer, address indexed creator, string hash, string metadataHash,
    uint256 indexed creationId, uint256 orderId, uint256 price);
  event NewOrder(address indexed buyer, address indexed creator, string hash, string metadataHash,
    uint256 indexed id, uint256 price, string recipient, uint256 orderId);
  event PaymentContractChanged(address indexed paymentContract);
  event Payment(address indexed payee, uint256 amount, uint256 orderId);
}
