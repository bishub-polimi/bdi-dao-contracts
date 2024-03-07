// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EuroCoin is
  ERC20,
  Ownable(msg.sender)
{
  constructor() ERC20("EuroCoin", "EUROC") {
    //mint(msg.sender, 10000000);
  }

  function decimals() public view virtual override returns (uint8) {
    return 6;
  }

  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }
}
