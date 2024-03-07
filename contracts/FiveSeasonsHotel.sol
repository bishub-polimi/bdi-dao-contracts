// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FiveSeasonsHotel is ERC20,Ownable {

  uint256 public TOTAL_SHARES = 100;  
  uint256 public PRICE_PER_SHARE = 1000000;
  IERC20 public euroCoin;

  constructor(address _euroCoin) ERC20("FiveSeasons", "FIVES") Ownable(msg.sender){
    euroCoin = IERC20(_euroCoin);
  }

  function decimals() public view virtual override returns (uint8) {
    return 0;
  }

  function buyShares(uint256 amount) public {
    require(euroCoin.balanceOf(msg.sender) >= amount * PRICE_PER_SHARE, "Euro balance is too low");
    require(amount <= TOTAL_SHARES - totalSupply(), "Required amount exceeds cap");
    euroCoin.transferFrom(msg.sender,owner(), amount * PRICE_PER_SHARE);
    _mint(msg.sender, amount);
  }
}
