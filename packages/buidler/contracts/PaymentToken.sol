pragma solidity >=0.6.0 <0.7.0;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@nomiclabs/buidler/console.sol";

contract PaymentToken is AccessControl, ERC20 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    constructor(string memory name, string memory symbol) public ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _mint(_msgSender(), 10000 * (10 ** 18));
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 amount) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Must have minter role to mint");
        _mint(to, amount);
    }
}