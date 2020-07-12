pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@nomiclabs/buidler/console.sol";

contract PadlockNFT is AccessControl, Ownable, ERC721Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @dev Grants `MINTER_ROLE` to the account that deploys the contract.
     *
     * See {ERC721-constructor}.
     */
    constructor(string memory name, string memory symbol, address minter) public ERC721(name, symbol) {
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Creates the `tokenId` tokens for `to`.
     *
     * See {ERC721-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 tokenId) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Must have minter role");
        _mint(to, tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
}