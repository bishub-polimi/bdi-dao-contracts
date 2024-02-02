// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract BdIToken is ERC20, Ownable, ERC20Permit, ERC20Votes {
    IERC20 public euroCoin;
    address public daoAddr;

    constructor(IERC20 _euroCoin) ERC20("BdIToken", "BDI") Ownable(msg.sender) ERC20Permit("BdIToken")
    { 
        euroCoin = _euroCoin;
    }

    function setDaoContractAddress(address _add) public onlyOwner {
        daoAddr = _add;
    }

    function mint(address to, uint256 amount) external {
        euroCoin.transferFrom(msg.sender, daoAddr, amount);
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
